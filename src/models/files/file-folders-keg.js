const SyncedKeg = require('../kegs/synced-keg');
const { observable } = require('mobx');

class FileFoldersKeg extends SyncedKeg {
    constructor(db) {
        super('file_folders', db);
    }

    @observable formatVersion;
    @observable folders = [];

    serializeKegPayload() {
        const { formatVersion, folders } = this;
        return { formatVersion, folders };
    }

    deserializeKegPayload(payload) {
        console.log('deserialize file folders keg');
        const { formatVersion, folders } = payload;
        Object.assign(this, { formatVersion, folders });
    }
}

module.exports = FileFoldersKeg;
