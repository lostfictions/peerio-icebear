const Keg = require('./keg');
const util = require('../../crypto/util');

class BootKeg extends Keg {
    /**
     * @param {KegDb} db - owner instance
     * @param {Uint8Array} bootKey
     */
    constructor(db, bootKey) {
        // named kegs are pre-created, so we know the id already and only going to update boot keg
        super(db, 'boot', 'system');
        this.key = bootKey;
        this.version = 1; // already created
        this.deserializeData = this.deserializeData.bind(this);
        this.serializeData = this.serializeData.bind(this);
    }

    deserializeData(data) {
        data.signKeys.publicKey = util.b64ToBytes(data.signKeys.publicKey);
        data.signKeys.secretKey = util.b64ToBytes(data.signKeys.secretKey);
        data.encryptionKeys.publicKey = util.b64ToBytes(data.encryptionKeys.publicKey);
        data.encryptionKeys.secretKey = util.b64ToBytes(data.encryptionKeys.secretKey);
        data.kegKey = util.b64ToBytes(data.kegKey);
        return data;
    }

    serializeData() {
        const ret = {
            signKeys: {
                publicKey: util.bytesToB64(this.data.signKeys.publicKey),
                secretKey: util.bytesToB64(this.data.signKeys.secretKey)
            },
            encryptionKeys: {
                publicKey: util.bytesToB64(this.data.encryptionKeys.publicKey),
                secretKey: util.bytesToB64(this.data.encryptionKeys.secretKey)
            },
            kegKey: util.bytesToB64(this.data.kegKey)
        };
        return ret;
    }
}

module.exports = BootKeg;
