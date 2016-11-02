const items = {
};

const store = {
    register(id, instance) {
        if (items[id]) {
            console.log(`Key ${id} already exists`);
        }
        items[id] = instance;
    },

    update(id, data) {
        const i = items[id];
        if (!i) {
            console.error(`Key ${id} not found, returning`);
            return;
        }
        if (!i.processKegDbUpdate) {
            console.error(`No suitable method to process keg db update for ${id}`);
            return;
        }
        i.processKegDbUpdate(data);
    },

    _all() {
        return items;
    }
};

module.exports = store;
