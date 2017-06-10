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
        if (this.collectionVersion === null || this.collectionVersion >= digest.maxUpdateId) {
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

    /**
     * Enqueues Save task.
     *
     * @param {function<bool>} dataChangeFn - function that will be called right before keg save,
     * it has to mutate keg's state. Return false to cancel save.
     * @param {[function]} dataRestoreFn - function that will be called to restore keg state to the point before
     * dataChangeFn mutated it. Default implementation will rely on keg serialization functions. dataRestoreFn will only
     * get called if version of the keg didn't change after save failed. This will make sure we won't overwrite
     * freshly received data from server.
     * @param {[string]} errorLocaleKey - optinal error to show in snackbar
     * @returns {Promise}
     *
     * @memberof SyncedKeg
     */
    save(dataChangeFn, dataRestoreFn, errorLocaleKey) {
        return new Promise((resolve, reject) => {
            this._syncQueue.addTask(() => {
                const ver = this.version;

                if (!dataRestoreFn) {
                    // implementing default restore logic
                    const payload = this.serializeKegPayload();
                    const props = this.serializeProps();
                    //eslint-disable-next-line
                    dataRestoreFn = () => {
                        this.deserializeProps(props);
                        this.deserializeKegPayload(payload);
                    };
                }

                if (!dataChangeFn()) {
                    // dataChangeFn decided not to save changes
                    return null;
                }

                return this.saveToServer().tapCatch(() => {
                    this.onSaveError(errorLocaleKey);
                    // we don't restore unless there was no changes after ours
                    if (ver !== this.version) return;
                    dataRestoreFn();
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
