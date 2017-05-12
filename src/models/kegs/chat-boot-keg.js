const L = require('l.js');
const Keg = require('./keg');
const { cryptoUtil, publicCrypto, keys } = require('../../crypto');

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
     * @param {User} user - currently authenticated user
     * @param {[object]} participantPublicKeys - username:publicKey map, pass when creating new keg
     */
    constructor(db, user, participantPublicKeys) {
        // named kegs are pre-created, so we know the id already and only going to update boot keg
        super('boot', 'boot', db, true);
        this.user = user;
        this.version = 1; // pre-created named keg
        this.participantPublicKeys = participantPublicKeys;
    }

    /**
     * As we don't expect updates to bootkeg after initial creation yet,
     * this function just extracts what's needed - kegKey
     * @param data
     * @returns {Object}
     */
    deserializeKegPayload(data) {
        // keys for every participant
        this.encryptedKeys = data.encryptedKeys;
        // public key from ephemeral key pair that encrypted keys
        this.publicKey = cryptoUtil.b64ToBytes(data.publicKey);
        // decrypting keg key that was encrypted for me
        let kegKey = data.encryptedKeys[this.user.username];
        kegKey = cryptoUtil.b64ToBytes(kegKey);
        kegKey = publicCrypto.decrypt(kegKey, this.publicKey, this.user.encryptionKeys.secretKey);
        if (kegKey === false) {
            L.error('Failed to decrypt chat key for myself.');
            // todo: mark as invalid to prevent message loading attempts?
            return;
        }
        this.kegKey = kegKey;
    }

    /**
     * Expected data format
     *  kegKey: buffer,
     *  encryptedKeys: {username: publicKey, username: publicKey}
     * @returns {{publicKey, encryptedKeys: {}}}
     */
    serializeKegPayload() {
        // if there's no keg key - we need to create it, it's a new bootkeg
        if (!this.kegKey) this.kegKey = keys.generateEncryptionKey();
        // ephemeral key pair will be encrypting keg key for all participants
        const ephemeralKeyPair = keys.generateEncryptionKeyPair();
        const ret = {
            // users will need ephemeral public key to decrypt keg key
            publicKey: cryptoUtil.bytesToB64(ephemeralKeyPair.publicKey),
            encryptedKeys: {}
        };
        // iterating user public keys and encrypting kegKey for them
        for (const username of Object.keys(this.participantPublicKeys)) {
            const userPKey = this.participantPublicKeys[username];
            const encKey = publicCrypto.encrypt(this.kegKey, userPKey, ephemeralKeyPair.secretKey);
            ret.encryptedKeys[username] = cryptoUtil.bytesToB64(encKey);
        }
        return ret;
    }
}

module.exports = ChatBootKeg;
