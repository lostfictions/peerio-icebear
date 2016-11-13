/**
 * Keg update handling module
 */
/*

Update actions:
+ 1. Get and store actual update info on auth    -  updates module
+ 2. Get and store actual update info on event   -  updates module
3. Pull updated data if needed                 -  corresponding stores (chat etc.)
4. Inform server about read stuff              -  stores -> updates module -> server
+ 5. Display unread notifications                -  UI -> updates module

 */
const socket = require('../network/socket');
const { observable, asMap, action, transaction } = require('mobx');

/**
 * Update information for specific db and keg type
 */
class UpdateInfo {
    @observable knownUpdateId = 0;
    @observable maxUpdateId = 0;
    @observable newKegsCount = 0;
}

/** returns a tracker for known types for one db */
class KnownTypesTracker {
        @observable system = new UpdateInfo();
        @observable profile = new UpdateInfo();
        @observable message = new UpdateInfo();
}

class UpdateTracker {
    // data[dbId][kegType].knownUpdateId
    @observable data = asMap();
    started = false;

    constructor() {
        socket.onceStarted(this.start.bind(this));
    }

    start() {
        if (this.started) return;
        this.started = true;
        socket.subscribe(socket.APP_EVENTS.kegsUpdate, this.processUpdateEvent.bind(this));
        socket.subscribe(socket.SOCKET_EVENTS.authenticated, this.loadFullUpdateData.bind(this));
        if (socket.authenticated) this.loadFullUpdateData();
    }

    processUpdateEvent(d) {
        if (!this.data.has(d.kegDbId)) {
            this.data.set(d.kegDbId, new KnownTypesTracker());
        }
        const tracker = this.data.get(d.kegDbId)[d.type];
        if (!tracker) {
            console.warn(`Unknown keg type: ${d.type}`);
            return;
        }
        tracker.knownUpdateId = d.downloadedUpdateId;
        tracker.maxUpdateId = d.maxUpdateId;
        tracker.newKegsCount = d.newKegsCount;
    }

    /**
     * Fills this.data with full update info from server
     */
    loadFullUpdateData() {
        console.log('Loading full update data.');
        socket.send('/auth/kegs/updates/digest')
            .then(action(digest => {
                for (const d of digest) {
                    this.processUpdateEvent(d);
                }
            }));
    }

    seenThis(chatId, type, updateId) {
        socket.send('/auth/kegs/updates/last-known-version', {
            collectionId: chatId,
            type,
            lastKnownVersion: updateId
        });
    }
}

module.exports = new UpdateTracker();
