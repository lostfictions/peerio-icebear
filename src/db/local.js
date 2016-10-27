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

    name(n) {
        return `${this.prefix}::${n}`;
    }

    get(n) {
        return engine.getValue(this.name(n));
    }

    set(n, v) {
        return engine.setValue(this.name(n), v);
    }
}

function setEngine(params) {
    engine.setValue = params.setValue;
    engine.getValue = params.getValue;
}

const db = {
    system: new LocalDb('system')
};

module.exports = { LocalDb, setEngine, db };
