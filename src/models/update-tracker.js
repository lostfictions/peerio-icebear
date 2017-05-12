/**
 * Keg update handling module
 */
const L = require('l.js');
const socket = require('../network/socket');

/*
 * How does update tracking work:
 *
 * 1. Update Tracker interacts with application logic via
 *      a. UpdateTracker.digest object - at any time, app logic can read data from that object,
 *          although it's not always guaranteed to be fully up to date, but it is not a problem because:
 *      b. Update events - update events are triggered in an optimized(batched) manner
 * 2. Every time connection is authenticated, Update Tracker performs update of relevant data
 *    (cuz we might have missed it while disconnected). We don't do full update info reload because it has
 *    a potential to grow really big.
 *      a. SELF database info is always reloaded
 *      b. anything that is {unread: true} is reloaded
 *      c. anything that contains {kegType: 'critical keg type(we don't have them yet)'} is reloaded
 *      d. anything that is currently active in the UI (chat) is reloaded
 */
class UpdateTracker {
    // listeners to new keg db added event
    dbAddedHandlers = [];
    // listeners to changes in existing keg dbs
    updateHandlers = {};
    // keg databases that are currently 'active' in UI (user interacts with them directly)
    // we need this to make sure we update them on reconnect
    activeKegDbs = ['SELF'];
    // tracker data
    digest = {};
    // this flag controls whether updates to digest will immediately fire an event or
    // will accumulate to allow effective/minimal events generation after large amounts for digest data
    // has been processed
    accumulateEvents = true;
    // accumulated events go here
    eventCache = { add: [], update: {} };

    constructor() {
        socket.onceStarted(() => {
            socket.subscribe(socket.APP_EVENTS.kegsUpdate, this.processDigestEvent.bind(this));
            socket.onAuthenticated(this.loadDigest.bind(this));
            // when disconnected, we know that reconnect will trigger digest reload
            // and we want to accumulate events during that time
            socket.onDisconnect(() => { this.accumulateEvents = true; });
            if (socket.authenticated) this.loadDigest();
        });
    }

    // to return from getDigest()
    zeroDigest = { maxUpdateId: '', knownUpdateId: '', newKegsCount: 0 };

    /**
     * Wrapper around this.digest to safely retrieve data that might be not retrieved yet,
     * so we want to avoid null reference. This function will return zeroes in case of null.
     * @param {string} id - keg db id
     * @param {string} type - keg type
     */
    getDigest(id, type) {
        if (!this.digest[id]) return this.zeroDigest;
        const d = this.digest[id][type];
        if (!d) return this.zeroDigest;
        return d;
    }

    /**
     * Subscribes handler to an event of new keg db created for this user
     * @param {function} handler
     */
    onKegDbAdded(handler) {
        if (this.dbAddedHandlers.includes(handler)) {
            L.error('This handler already subscribed to onKegDbAdded');
            return;
        }
        this.dbAddedHandlers.push(handler);
    }

    /**
     * Subscribes handler to an event of keg of specific type change in keg db
     * @param {string} kegDbId - id of the db to watch
     * @param {string} kegType - keg type to watch
     * @param {function} handler
     */
    onKegTypeUpdated(kegDbId, kegType, handler) {
        if (!this.updateHandlers[kegDbId]) {
            this.updateHandlers[kegDbId] = {};
        }

        if (!this.updateHandlers[kegDbId][kegType]) {
            this.updateHandlers[kegDbId][kegType] = [];
        }
        if (this.updateHandlers[kegDbId][kegType].includes(handler)) {
            L.error('This handler already subscribed to onKegTypeUpdated');
            return;
        }
        this.updateHandlers[kegDbId][kegType].push(handler);
    }

    /**
     * Lets Update Tracker know that user is interested in this database full updates even after reconnect
     * @param {string} id - keg db id
     */
    activateKegDb(id) {
        if (this.activeKegDbs.includes(id)) return;
        this.activeKegDbs.push(id);
        // eslint-disable-next-line
        return socket.send('/auth/kegs/updates/digest', { kegDbIds: [id] })
            .then(this._processDigestResponse)
            .then(this._flushAccumulatedEvents);
    }


    deactivateKegDb(id) {
        const ind = this.activeKegDbs.indexOf(id);
        if (ind < 0) return;
        this.activeKegDbs.splice(ind, 1);
    }

    /**
     * Unsubscribes handler from all events (onKegTypeUpdated, onKegDbAdded)
     * @param {function} handler
     */
    unsubscribe(handler) {
        let ind = this.dbAddedHandlers.indexOf(handler);
        if (ind >= 0) this.dbAddedHandlers.splice(ind, 1);

        for (const db in this.updateHandlers) {
            for (const type in this.updateHandlers[db]) {
                ind = this.updateHandlers[db][type].indexOf(handler);
                if (ind >= 0) this.updateHandlers[db][type].splice(ind, 1);
            }
        }
    }

    removeDbDigest(id) {
        delete this.digest[id];
    }

    //  {"kegDbId":"SELF","type":"profile","maxUpdateId":3, knownUpdateId: 0, newKegsCount: 1},
    processDigestEvent(ev) {
        ev.maxUpdateId = ev.maxUpdateId || '';
        ev.knownUpdateId = ev.knownUpdateId || '';
        // === HACK:
        // this is a temporary hack to make sure boot kegs don't produce unread keg databases
        // It's too much hussle to create handlers for this in the kegdb logic
        // when we introduce key change which can change boot keg - this should go away
        if (ev.type === 'boot' && ev.maxUpdateId !== ev.knownUpdateId) {
            this.seenThis(ev.kegDbId, 'boot', ev.maxUpdateId);
        }
        // The same for tofu keg, it's never supposed to be updated atm so we always mark it as read
        if (ev.type === 'tofu' && ev.maxUpdateId !== ev.knownUpdateId) {
            this.seenThis(ev.kegDbId, 'tofu', ev.maxUpdateId);
        }
        // The same for my_chats keg, we don't rely on its collection version currently
        if (ev.type === 'my_chats' && ev.maxUpdateId !== ev.knownUpdateId) {
            this.seenThis(ev.kegDbId, 'my_chats', ev.maxUpdateId);
        }
        // === /HACK

        // here we want to do 2 things
        // 1. update internal data tracker
        // 2. fire or accumulate events

        let shouldEmitUpdateEvent = false;

        // kegDb yet unknown to our digest? consider it just added
        if (!this.digest[ev.kegDbId]) {
            shouldEmitUpdateEvent = true;
            this.digest[ev.kegDbId] = {};
            if (this.accumulateEvents) {
                if (!this.eventCache.add.includes(ev.kegDbId)) {
                    this.eventCache.add.push(ev.kegDbId);
                }
            } else {
                this.emitKegDbAddedEvent(ev.kegDbId);
            }
        }
        const dbDigest = this.digest[ev.kegDbId];
        if (!dbDigest[ev.type]) {
            shouldEmitUpdateEvent = true;
            dbDigest[ev.type] = {};
        }
        const typeDigest = dbDigest[ev.type];
        // if this db and keg type was already known to us
        // we need to check if this event actually brings something new to us,
        // or maybe it was out of order and we don't care for its data
        if (!shouldEmitUpdateEvent
            && typeDigest.maxUpdateId >= ev.maxUpdateId
            && typeDigest.knownUpdateId >= ev.knownUpdateId
            && typeDigest.newKegsCount === ev.newKegsCount) {
            return; // known data / not interested
        }
        // storing data in internal digest cache
        typeDigest.maxUpdateId = ev.maxUpdateId;
        typeDigest.knownUpdateId = ev.knownUpdateId;
        typeDigest.newKegsCount = ev.newKegsCount;
        // creating event
        if (this.accumulateEvents) {
            const rec = this.eventCache.update[ev.kegDbId] = this.eventCache.update[ev.kegDbId] || [];
            if (!rec.includes(ev.type)) {
                rec.push(ev.type);
            }
        } else {
            this.emitKegTypeUpdatedEvent(ev.kegDbId, ev.type);
        }
    }

    emitKegDbAddedEvent(id) {
        this.dbAddedHandlers.forEach(handler => {
            try {
                handler(id);
            } catch (err) {
                L.error(err);
            }
        });
    }

    emitKegTypeUpdatedEvent(id, type) {
        if (!this.updateHandlers[id] || !this.updateHandlers[id][type]) return;
        this.updateHandlers[id][type].forEach(handler => {
            try {
                handler();
            } catch (err) {
                L.error(err);
            }
        });
    }

    _flushAccumulatedEvents = () => {
        this.eventCache.add.forEach(id => {
            this.emitKegDbAddedEvent(id);
        });
        for (const id in this.eventCache.update) {
            this.eventCache.update[id].forEach(type => {
                this.emitKegTypeUpdatedEvent(id, type);
            });
        }
        this.eventCache = { add: [], update: {} };
        this.accumulateEvents = false;
    };

    _processDigestResponse = digest => {
        console.debug('Processing digest response');
        for (let i = 0; i < digest.length; i++) {
            // console.debug(JSON.stringify(digest[i], null, 1));
            this.processDigestEvent(digest[i]);
        }
    };

    /**
     * Fills this.data with full update info from server.
     * Initial call, reads only unread data.
     */
    loadDigest() {
        L.info(`Requesting unread digest. And full collections: ${this.activeKegDbs}`);
        socket.send('/auth/kegs/updates/digest', { unread: true })
            .then(this._processDigestResponse)
            .then(() => socket.send('/auth/kegs/updates/digest', { kegDbIds: this.activeKegDbs }))
            .then(this._processDigestResponse)
            .then(this._flushAccumulatedEvents);
    }

    /**
     * Stores max update id that user has seen to server.
     * @param {string} id - keg db id
     * @param {string} type - keg type
     * @param {string} updateId - max known update id
     */
    seenThis(id, type, updateId) {
        if (!updateId) return;
        const digest = this.getDigest(id, type);
        if (digest.knownUpdateId >= updateId) return;
        socket.send('/auth/kegs/updates/last-known-version', {
            kegDbId: id,
            type,
            lastKnownVersion: updateId
        });
    }
}

module.exports = new UpdateTracker();
