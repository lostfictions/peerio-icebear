/**
 * Pluggable local storage for small amounts of data.
 * Icebear lib delegates to desktop and mobile apps storage implementation injection to this interface.
 *
 * call require('icebear').setTinyDbEngine(YourDBImplementation) before using icebear library.
 *
 * Your implementation should expose the following API:
 * - setValue (key, val)
 * - getValue (key)
 *
 * All functions should return promises.
 */
const mockDb = {};

const engine = {
    setValue: (key, val) => {
        console.log(`set -- TinyDb in-memory mock call.`);
        mockDb[key] = val;
        return Promise.resolve();
    },

    getValue: key => {
        console.log(`get --TinyDb in-memory mock call.`);
        return Promise.resolve(mockDb[key]);
    },

    removeValue: key => {
        console.log(`remove --TinyDb in-memory mock call.`);
        delete mockDb[key];
        return Promise.resolve();
    }
};

const db = {
    /**
     * Call to set the actual storage implementation functions
     * @param implementation<{{setValue: function, getValue: function}}>
     */
    setEngine: implementation => {
        engine.setValue = implementation.setValue;
        engine.getValue = implementation.getValue;
    },

    prefix: 'icebearlib',
    /** Format key name from prefix for db key */
    getKey: key => `${db.prefix}::${key}`,

    /**
     * Get value for key
     * @param {string} key - key
     * @returns {Promise<object>}
     */
    get: key => engine.getValue(db.getKey(key)),

    /**
     * Set value for key
     * @param {string} key - key
     * @param {Object} val - JSON-serializable value
     * @return {Promise}
     */
    set: (key, val) => engine.setValue(db.getKey(key), val),

    /**
     * remove a key
     * @param {string} key
     */
    remove: (key) => engine.removeValue(db.getKey(key))
};

module.exports = db;
