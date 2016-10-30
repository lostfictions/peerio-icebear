/**
 * Keg database module
 */
const SharedBootKeg = require('./shared-boot-keg');

class SharedKegDb {
    /**
     * Creates new database instance
     * @param {string} id - 'SELF' for own database, or specific id for shared databases
     */
    constructor(id, users) {
        if (!id) throw new Error('SharedKegDb id is required to create instance.');
        if (!users) throw new Error('SharedKegDb user list is required to create instance.');
        this.id = id;
        this.kegs = {};
        this.users = users;
        this.createBootKeg = this.createBootKeg.bind(this);
        this.loadBootKeg = this.loadBootKeg.bind(this);
    }

    /**
     * Create boot keg for this database
     * todo: when we will have key change, we'll need update operation load()->update() because of keg version
     * @param {Uint8Array} bootKey
     * @param {Object} data
     */
    createBootKeg() {
        const users = this.users;
        const boot = new SharedBootKeg(this);
        boot.data = { users };
        return boot.update().then(() => {
            this.kegs.boot = boot;
            return boot;
        });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    loadBootKeg(bootKey) {
        const boot = new SharedBootKeg(this, bootKey);
        return boot.load().then(() => {
            this.kegs.boot = boot;
            return boot;
        });
    }

}

module.exports = SharedKegDb;

