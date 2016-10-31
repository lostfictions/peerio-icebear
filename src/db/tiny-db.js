/**
 * Pluggable local storage for small amounts of data.
 * Icebear lib delegates to desktop and mobile apps storage implementation injection to this interface.
 *
 * call require('icebear').localDb.setEngine(..) before using icebear library.
 */
const mockDb = {};

const engine = {
    setValue: (key, val) => {
        console.log(`TinyDb in-memory mock call.`);
        mockDb[key] = val;
        return Promise.resolve();
    },

    getValue: key => {
        console.log(`TinyDb in-memory mock call.`);
        return Promise.resolve(mockDb[key]);
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
    set: (key, val) => engine.setValue(db.getKey(key), val)
};

module.exports = db;
