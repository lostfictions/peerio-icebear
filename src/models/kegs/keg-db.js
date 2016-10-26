/**
 * Keg database module
 */
const BootKeg = require('./boot-keg');

class KegDb {
    /**
     * Creates new database instance
     * @param {string} id - 'SELF' for own database, or specific id for shared databases
     */
    constructor(id) {
        if (!id) throw new Error('KegDb id is required to create instance.');
        this.id = id;
        this.kegs = {};
    }

    /**
     * Create boot keg for this database
     * todo: when we will have key change, we'll need update operation load()->update() because of keg version
     * @param {Uint8Array} bootKey
     * @param {Object} data
     */
    createBootKeg(bootKey, data) {
        const boot = new BootKeg(this, bootKey);
        boot.data = data;
        this.key = data.kegKey;
        return boot.update().then(() => {
            this.kegs.boot = boot;
        });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    loadBootKeg(bootKey) {
        const boot = new BootKeg(this, bootKey);
        return boot.load().then(() => {
            this.kegs.boot = boot;
            this.key = boot.data.kegKey;
        });
    }

}

module.exports = KegDb;
