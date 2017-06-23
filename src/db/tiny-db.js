const secret = require('../crypto/secret');
const util = require('../crypto/util');
const config = require('../config');

let systemDb;
/**
 * Local storage for small amounts of data like user preferences and flags.
 * @param {string} name - database name
 * @param {Uint8Array} [encryptionKey] - encryption key
 * @public
 * @example
 * // at any time use unencrypted shared database
 * TinyDb.system.getValue('lastAuthenticatedUsername');
 * @example
 * // after successful login use User's personal encrypted database.
 * // Only values are encrypted.
 * TinyDb.user.setValue('lastUsedEmoji',':grumpy_cat:')
 */
class TinyDb {
    constructor(name, encryptionKey) {
        this.name = name;
        this.encryptionKey = encryptionKey;
        this.engine = new config.StorageEngine(name);
    }

    /**
     * Instance of unencrypted system database.
     * @member {TinyDb}
     * @static
     * @public
     */
    static get system() {
        if (!systemDb) TinyDb.openSystemDb();
        return systemDb;
    }

    /**
     * Instance of encrypted user database.
     * Only values are encrypted.
     * @const {TinyDb}
     * @static
     * @public
     */
    static user = null;

    /**
     * Creates system database instance and assigns it to {@link system} property
     * @private
     */
    static openSystemDb() {
        systemDb = new TinyDb('$system$');
    }

    /**
     * Creates user database instance.
     * @param {string} username
     * @param {Uint8Array} encryptionKey - database key
     * @protected
     */
    static openUserDb(username, encryptionKey) {
        TinyDb.user = new TinyDb(username, encryptionKey);
    }

    /**
     * @param {string} valueString
     * @returns {string} ciphertext
     * @private
     */
    encrypt = (valueString) => {
        if (!this.encryptionKey) return valueString;
        const buf = secret.encryptString(valueString, this.encryptionKey);
        return util.bytesToB64(buf);
    };

    /**
     * @param {string} ciphertext
     * @returns {string}
     * @private
     */
    decrypt = (ciphertext) => {
        if (ciphertext == null) return null;
        if (!this.encryptionKey) return ciphertext;
        const buf = util.b64ToBytes(ciphertext);
        return secret.decryptString(buf, this.encryptionKey);
    };

    /**
     * Gets a value from TinyDb.
     * @param {string} key
     * @returns {Promise<any>} - JSON.parse() result of retrieved value
     * @public
     */
    getValue(key) {
        if (!key) return Promise.reject(new Error('Invalid TinyDb key'));
        return this.engine.getValue(key)
            .then(this.decrypt)
            .then(JSON.parse);
    }

    /**
     * Stores a value in TinyDb.
     * @param {string} key
     * @param {any} value - will be serialized with JSON.stringify() before storing.
     * @returns {Promise}
     * @public
     */
    setValue(key, value) {
        if (!key) return Promise.reject(new Error('Invalid tinydb key'));
        let val = JSON.stringify(value == null ? null : value);
        val = this.encrypt(val);
        return this.engine.setValue(key, val);
    }

    /**
     * Removes value from TinyDb
     * @param {string} key
     * @returns {Promise}
     * @public
     */
    removeValue(key) {
        if (!key) return Promise.reject(new Error('Invalid tinydb key'));
        return this.engine.removeValue(key);
    }

    /**
     * Returns a list of all keys in TinyDb
     * @returns {Promise<string[]>}
     * @public
     */
    getAllKeys() {
        return this.engine.getAllKeys();
    }

    /**
     * Clears all TinyDb values
     * @public
     */
    clear() {
        this.engine.clear();
    }
}

module.exports = TinyDb;
