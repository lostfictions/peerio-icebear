const Keg = require('./keg');
// const util = require('../../crypto/util');

class SharedBootKeg extends Keg {
    /**
     * @param {KegDb} db - owner instance
     * @param {Uint8Array} bootKey
     */
    constructor(db) {
        // named kegs are pre-created, so we know the id already and only going to update boot keg
        super(db, 'boot', 'system');
        this.version = 1; // already created
        this.plaintext = true;
        this.data = { test: 'some shared boot keg data' };
    }

}

module.exports = SharedBootKeg;
