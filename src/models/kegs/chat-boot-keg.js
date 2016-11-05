const Keg = require('./keg');
const util = require('../../crypto/util');
const publicCrypto = require('../../crypto/public');

// todo: we need more reliable - server controlled participant info
// todo: or some kind of protection from peers corrupting data
/**
 * payload format
 * {
 *   publicKey: buffer,
 *   encryptedKeys: {
 *           username: buffer, // encrypted for user's PK
 *           username1: buffer1
 *         }
 * }
 */

class ChatBootKeg extends Keg {
    /**
     * @param {KegDb} db - owner instance
     * @param {string} username - currently authenticated username
     * @param {KeyPair} encryptionKeys - user's encryption keys
     * @param {[KeyPair]} ephemeralKeyPair - when creating new boot keg pass encryption keys
     */
    constructor(db, username, encryptionKeys, ephemeralKeyPair) {
        // named kegs are pre-created, so we know the id already and only going to update boot keg
        super(db, 'boot', 'system');
        this.encryptionKeys = encryptionKeys; // todo: doesn't feel right caching them here
        this.ephemeralKeyPair = ephemeralKeyPair;
        this.username = username;
        this.version = 1; // already created
        this.plaintext = true; // not really but root object is plaintext
    }

    /**
     * As we don't expect updates to bootkeg after initial creation yet,
     * this function just extracts what's needed - kegKey
     * @param data
     * @returns {Object}
     */
    deserializeData(data) {
        data.publicKey = util.b64ToBytes(data.publicKey);
        let myKey = data.encryptedKeys[this.username];
        myKey = util.b64ToBytes(myKey);
        myKey = publicCrypto.decrypt(myKey, data.publicKey, this.encryptionKeys.secretKey);
        if (myKey === false) {
            console.error('Failed to decrypt chat key for user.');
            return data;
        }
        return { kegKey: myKey, encryptedKeys: data.encryptedKeys };
    }

    /**
     * Expected data format
     *  kegKey: buffer,
     *  encryptedKeys: {username: publicKey, username: publicKey}
     * @returns {{publicKey, encryptedKeys: {}}}
     */
    serializeData() {
        const ret = {
            publicKey: util.bytesToB64(this.ephemeralKeyPair.publicKey),
            encryptedKeys: {}
        };
        const encryptedKeys = this.data.encryptedKeys;
        for (const username of Object.keys(encryptedKeys)) {
            const userPKey = encryptedKeys[username];
            const encKey = publicCrypto.encrypt(this.data.kegKey, userPKey, this.ephemeralKeyPair.secretKey);
            ret.encryptedKeys[username] = util.bytesToB64(encKey);
        }
        return ret;
    }
}

module.exports = ChatBootKeg;
