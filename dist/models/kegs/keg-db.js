'use strict';

const BootKeg = require('./boot-keg');

/**
 * Keg database.
 * This class is for user's own database ('SELF')
 * @public
 */
let KegDb = class KegDb {

    /**
     * Current key id for the database
     * @member {?string}
     * @readonly
     * @public
     */

    /**
     * Always equals 'SELF'
     * @member {string}
     * @public
     */
    get keyId() {
        return this.boot ? this.boot.kegKeyId : null;
    }

    /**
     * @member {BootKeg}
     * @public
     */


    /**
     * Database key to use for keg encryption.
     * @member {Uint8Array}
     * @public
     */


    constructor() {
        this.id = 'SELF';
    }

    /**
     * Creates boot keg for this database.
     * todo: when we will have key change, we'll need update operation load()->update() because of keg version
     * @param {Uint8Array} bootKey
     * @param {KeyPair} signKeys
     * @param {KeyPair} encryptionKeys
     * @param {Uint8Array} kegKey
     * @protected
     */
    createBootKeg(bootKey, signKeys, encryptionKeys, kegKey) {
        console.log('Creating boot keg of "SELF".');
        const boot = new BootKeg(this, bootKey);
        Object.assign(boot, {
            signKeys,
            encryptionKeys,
            kegKey
        });
        boot.keys['0'] = { key: kegKey, createdAt: Date.now() };
        this.key = kegKey;
        this.boot = boot;
        return boot.saveToServer();
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     * @param {Uint8Array} bootKey
     * @protected
     */
    loadBootKeg(bootKey) {
        console.log('Loading boot keg of "SELF".');
        const boot = new BootKeg(this, bootKey);
        this.boot = boot;
        return boot.load().then(() => {
            this.key = boot.kegKey;
        });
    }

    /**
     * Custom JSON representation to avoid cycles when
     * doing JSON.stringify() on kegs.
     */
    toJSON() {
        return {
            id: this.id,
            key: this.key
        };
    }
};


module.exports = KegDb;