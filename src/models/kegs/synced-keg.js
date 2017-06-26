const socket = require('../../network/socket');
const tracker = require('../update-tracker');
const { retryUntilSuccess } = require('../../helpers/retry');
const Queue = require('../../helpers/queue');
const Keg = require('./keg.js');
const warnings = require('../warnings');
const { observable } = require('mobx');

/**
 * This class allows named kegs to share sync/save logic.
 * This is for named kegs only! Named kegs assume there's just one instance of it.
 * @param {string} kegName - kegName === kegType currently
 * @param {KegDb|ChatKegDb} db - this keg owner database
 * @param {boolean} [plaintext=false] - encrypted or not
 * @param {boolean} [forceSign=false] - force signature of plaintext kegs or not
 * @extends {Keg}
 * @public
 */
class SyncedKeg extends Keg {
    _syncQueue = new Queue(1, 0);
    /**
     * Sets to true when keg is loaded for the first time.
     * @member {boolean} loaded
     * @memberof SyncedKeg
     * @instance
     * @public
     */
    @observable loaded = false;

    constructor(kegName, db, plaintext = false, forceSign = false) {
        super(kegName, kegName, db, plaintext, forceSign, true);
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
        if (this.collectionVersion !== null && this.collectionVersion >= digest.maxUpdateId) {
            this.loaded = true;
            return Promise.resolve();
        }
        return this.reload();
    });

    /**
     * Forces updating keg data from server
     * @returns {Promise}
     * @public
     */
    reload() {
        return this.load()
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
     * @param {function} [dataRestoreFn] - function that will be called to restore keg state to the point before
     * dataChangeFn mutated it. Default implementation will rely on keg serialization functions. dataRestoreFn will only
     * get called if version of the keg didn't change after save failed. This will make sure we won't overwrite
     * freshly received data from server.
     * @param {string} [errorLocaleKey] - optional error to show in snackbar
     * @returns {Promise}
     * @public
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

                if (dataChangeFn() === false) {
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

    /**
     * Override to perform actions after keg data has been updated from server.
     * @protected
     * @abstract
     */
    onUpdated() {
        // abstract function
    }

    /**
     * Override if required. Default implementation generates medium warning if locale key is provided.
     * @param {string} [localeKey]
     * @protected
     * @abstract
     */
    onSaveError(localeKey) {
        if (!localeKey) return;
        warnings.add(localeKey);
    }

}


module.exports = SyncedKeg;
