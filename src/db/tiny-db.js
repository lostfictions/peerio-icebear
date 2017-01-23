/* eslint no-prototype-builtins:0 */

// An example of how to implement storage in client apps
/*
class KeyValueStorageExample {
    data = {};
    constructor(name) {
        this.name = name;
    }
    // should return null if value doesn't exist
    getValue(key) {
        return Promise.resolve(this.data[key]);
    }
    setValue(key, value) {
        this.data[key] = value;
        return Promise.resolve();
    }
    removeValue(key) {
        delete this.data[key];
        return Promise.resolve();
    }
    getAllKeys() {
        return Promise.resolve(Object.keys(this.data));
    }
}
*/

const secret = require('../crypto/secret');
const util = require('../crypto/util');
const config = require('../config');

let systemDb;

class TinyDb {
    // unencrypted system database, singleton
    static get system() {
        if (!systemDb) TinyDb.openSystemDb();
        return systemDb;
    }
    // encrypted user database
    static user = null;

    static openSystemDb() {
        systemDb = new TinyDb('system');
    }

    static openUserDb(username, key) {
        TinyDb.user = new TinyDb(username, key);
    }

    /**
     * @param {string} name - database name
     * @param {Uint8Array} [key] - encryption key
     */
    constructor(name, key) {
        this.name = name;
        this.key = key;
        this.engine = new config.StorageEngine(name);
    }

    /**
     * @param {string} valueString
     * @returns {string} ciphertext
     */
    _encrypt = (valueString) => {
        if (!this.key) return valueString;
        const buf = secret.encryptString(valueString, this.key);
        return util.bytesToB64(buf);
    };

    /**
     * @param {string} ciphertext
     * @returns {string}
     */
    _decrypt= (ciphertext) => {
        if (!this.key) return ciphertext;
        const buf = util.b64ToBytes(ciphertext);
        return secret.decryptString(buf, this.key);
    };

    /**
     * @param {string} key
     * @returns {Promise<Object>}
     */
    getValue(key) {
        return this.engine.getValue(key)
            .then(this._decrypt)
            .then(JSON.parse);
    }

    /**
     * @param {string} key
     * @param {Object} value
     * @returns {Promise}
     */
    setValue(key, value) {
        let val = JSON.stringify(value);
        val = this._encrypt(val);
        return this.engine.setValue(key, val);
    }

    removeValue(key) {
        return this.engine.removeValue(key);
    }

    getAllKeys() {
        return this.engine.getAllKeys();
    }

}

module.exports = TinyDb;
