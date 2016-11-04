/**
 * Keg database module
 */
const BootKeg = require('./boot-keg');
// const socket = require('../../network/socket');

class KegDb {
    /**
     * Creates new database instance
     * @param {string} id - 'SELF' for own database, or specific id for shared databases
     */
    constructor(id) {
        if (!id) throw new Error('KegDb id is required to create instance.');
        this.id = id;
        this.kegs = {};
        this.createBootKeg = this.createBootKeg.bind(this);
        this.loadBootKeg = this.loadBootKeg.bind(this);
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
        console.log('Creating boot keg.');
        const boot = new BootKeg(this, bootKey);
        boot.data = {
            signKeys,
            encryptionKeys,
            kegKey
        };
        this.key = kegKey;
        return boot.update().then(() => {
            this.kegs.boot = boot;
            this.key = boot.data.kegKey;
        });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    loadBootKeg(bootKey) {
        console.log('Loading boot keg.');
        const boot = new BootKeg(this, bootKey);
        return boot.load().then(() => {
            this.kegs.boot = boot;
            this.key = boot.data.kegKey;
        });
    }
}

module.exports = KegDb;
