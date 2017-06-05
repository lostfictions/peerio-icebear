const socket = require('../../network/socket');
const tracker = require('../update-tracker');
const { retryUntilSuccess } = require('../../helpers/retry');
const Queue = require('../../helpers/queue');
const Keg = require('./keg.js');
const warnings = require('../warnings');
const { observable } = require('mobx');

// This is for named kegs only.
// Named kegs assume there's just one instance of it.
class SyncedKeg extends Keg {
    _syncQueue = new Queue(1, 0);
    // sets to true when keg is loaded for the first time
    @observable loaded = false;

    constructor(kegName, db, plaintext = false, forceSign = false) {
        super(kegName, kegName, db, plaintext, forceSign);
        // this will make sure we'll update every time server sends a new digest
        // it will also happen after reconnect, becasue SELF digest is always refreshed on reconnect
        tracker.onKegTypeUpdated(db.id, kegName, this._enqueueLoad);
        // this will load initial data
        socket.onceAuthenticated(this._enqueueLoad);
    }

    _enqueueLoad = () => {
        this._syncQueue.addTask(this._loadKeg);
    };

    _loadKeg = () => retryUntilSuccess(() => {
        // do we even need to update?
        const digest = tracker.getDigest(this.db.id, this.type);
        if (this.collectionVersion && this.collectionVersion >= digest.maxUpdateId) {
            this.loaded = true;
            return Promise.resolve();
        }
        return this.reload();
    });

    reload() {
        return this.load(true)
            .then(() => {
                this.loaded = true;
                this.onUpdated();
                // this will make sure that we get any updates we possibly got notified about
                // while finishing current operation
                this._enqueueLoad();
            });
    }

    save(dataChangeFn, dataRestoreFn, errorLocaleKey) {
        return new Promise((resolve, reject) => {
            this._syncQueue.addTask(() => {
                const ver = this.version;
                dataChangeFn();
                return this.saveToServer().tapCatch(() => {
                    this.onSaveError(errorLocaleKey);
                    if (ver !== this.version) return;
                    if (dataRestoreFn) dataRestoreFn();
                });
            }, this, null, resolve, reject);
        });
    }

    // override to perform actions after keg data has been updated from server
    onUpdated() {
        // abstract function
    }

    // override if required
    onSaveError(localeKey) {
        if (!localeKey) return;
        warnings.add(localeKey);
    }

}


module.exports = SyncedKeg;
