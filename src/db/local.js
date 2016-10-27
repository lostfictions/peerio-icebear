/**
 * Pluggable local storage
 */

const engine = {
    setValue(name) {
        console.log(`set value polyfill for ${name}`);
        return Promise.resolve(null);
    },

    getValue(name) {
        console.log(`get value polyfill for ${name}`);
        return Promise.resolve(null);
    }
};

class LocalDb {
    constructor(prefix) {
        this.prefix = prefix || null;
    }

    /**
     * Format name from prefix for db key
     * @param n - string key
     */
    name(n) {
        return `${this.prefix}::${n}`;
    }

    /**
     * Get value for key
     * @param n - string key
     * @return value|null in promise
     */
    get(n) {
        return engine.getValue(this.name(n));
    }

    /**
     * Set value for key
     * @param n - string key
     * @param v - JSON-serializable value
     * @return promise
     */
    set(n, v) {
        return engine.setValue(this.name(n), v);
    }
}

/**
 * Set engine to be used for small db storage
 */
function setEngine(params) {
    engine.setValue = params.setValue;
    engine.getValue = params.getValue;
}

const db = {
    /**
     * Current system db
     */
    system: null,
    /**
     * Current user db
     */
    user: null,
    /**
     * Open/create db
     * @param name unique name of the db
     * @return LocalDb instance
     */
    open(name) {
        return new LocalDb(name);
    },
    /**
     * Open/create user db and set it as current user db
     * @param name Username
     * @return LocalDb instance
     */
    openUserDb(name) {
        db.user = db.open(name);
        return db.user;
    }
};

// common name for system db
db.system = db.open('system');

module.exports = { LocalDb, setEngine, db };
