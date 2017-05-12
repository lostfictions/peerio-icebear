/**
 * Keg database module.
 */
const L = require('l.js');
const BootKeg = require('./boot-keg');
// const socket = require('../../network/socket');;

class KegDb {
    /**
     * Creates new database instance.
     * This class is for user's own database ('SELF')
     */
    constructor() {
        this.id = 'SELF';
    }

    /**
     * Create boot keg for this database
     * todo: when we will have key change, we'll need update operation load()->update() because of keg version
     * @param {Uint8Array} bootKey
     * @param {{publicKey: Uint8Array, secretKey: Uint8Array}} signKeys
     * @param {{publicKey: Uint8Array, secretKey: Uint8Array}} encryptionKeys
     * @param {Uint8Array} kegKey
     */
    createBootKeg(bootKey, signKeys, encryptionKeys, kegKey) {
        L.info('Creating boot keg of "SELF".');
        const boot = new BootKeg(this, bootKey);
        Object.assign(boot, {
            signKeys,
            encryptionKeys,
            kegKey
        });
        this.key = kegKey;
        this.boot = boot;
        return boot.saveToServer();
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    loadBootKeg(bootKey) {
        L.info('Loading boot keg of "SELF".');
        const boot = new BootKeg(this, bootKey);
        this.boot = boot;
        return boot.load().then(() => {
            this.key = boot.kegKey;
        });
    }
}

module.exports = KegDb;
