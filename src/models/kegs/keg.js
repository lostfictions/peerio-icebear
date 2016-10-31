/**
 * Base class for kegs
 * @module models/keg
 */
const socket = require('../../network/socket');
const secret = require('../../crypto/secret');
const { AntiTamperError } = require('../../errors');
/**
 * Base class with common data and operations.
 * For clarity:
 * - we refer to runtime unencrypted keg data as `data`
 * - we(and server) refer to encrypted(or plaintext string) keg data as `payload`
 */
class Keg {
    /** @type {string} reserved for future keys change feature */
    keyId = '0';
    /** @type {Uint8Array} separate key for this keg, overrides regular keg key */
    key;
    /** @type {number} keg version */
    version = 0; // todo: default value?
    /** @type {object} unencrypted keg data to work with in runtime */
    data = {};
    /**
     * @param {string} type - keg type
     * @param {KegDb} db - keg database owning this keg
     * @param {string|null} id - kegId, or null for new kegs
     * @param {boolean|null} plaintext - should keg be encrypted
     */
    constructor(db, id, type, plaintext) {
        this.db = db;
        this.id = id;
        this.type = type;
        this.plaintext = !!plaintext;
    }

    /**
     * Creates keg (reserves id) and writes out payload with this.update()
     * @returns {Promise<Keg>}
     */
    create() {
        if (this.id) return Promise.reject(new Error(`Keg already exists (has id ${this.id})`));

        return socket.send('/auth/kegs/create', {
            collectionId: this.db.id,
            type: this.type
        }).then(resp => {
            this.id = resp.kegId;
            this.version = 1;
            return this.update();
        });
    }

    /**
     * Updates existing server keg with new/same data from this.payload
     * todo: reconcile optimistic concurrency failures
     * @returns {Promise}
     */
    update() {
        let payload = this.serializeData();
        // anti-tamper protection, we do it here, so we don't have to remember to do it somewhere else
        payload._sys = {
            kegId: this.id,
            type: this.type
        };
        payload = JSON.stringify(payload);
        return socket.send('/auth/kegs/update', {
            collectionId: this.db.id, // todo: rename to dbId on server and here
            update: {
                kegId: this.id,
                keyId: '0',
                type: this.type,
                payload: this.plaintext ? payload : secret.encryptString(payload, this.key || this.db.key).buffer,
                version: ++this.version, // todo: rethink this, in case of failure it should not really change
                collectionVersion: 0// todo: useless field, remove when server does
            }
        });
    }

    /**
     * Populates this keg instance with data from server
     * @returns {Promise.<Keg>}
     */
    load() {
        return socket.send('/auth/kegs/get', {
            collectionId: this.db.id,
            kegId: this.id
        }).then(keg => {
            let payload = keg.payload;
            if (!this.plaintext) {
                payload = new Uint8Array(keg.payload);
                payload = secret.decryptString(payload, this.key || this.db.key);
            }
            payload = JSON.parse(payload);
            payload = this.deserializeData(payload);
            this.detectTampering(payload);
            this.data = payload;
            return this;
        });
    }

    /**
     * Generic version that provides this.data as it is.
     * Override in child classes for fine-grained control over serialization.
     */
    serializeData() {
        return this.data;
    }

    /**
     * Generic version that parses decrypted keg payload string.
     * Override in child classes for fine-grained control over deserialization.
     */
    deserializeData(payload) {
        return payload;
    }

    /**
     * Compares keg metadata with encrypted payload to make sure server didn't change metadata.
     * @param payload {Object} - decrypted keg payload
     * @throws AntiTamperError
     */
    detectTampering(payload) {
        if (payload._sys.kegId !== this.id) {
            throw new AntiTamperError(`Inner ${payload._sys.kegId} and outer ${this.id} keg id mismatch.`);
        }
        if (payload._sys.type !== this.type) {
            throw new AntiTamperError(`Inner ${payload._sys.type} and outer ${this.type} keg type mismatch.`);
        }
    }

}

module.exports = Keg;
