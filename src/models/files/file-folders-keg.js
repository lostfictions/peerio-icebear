const SyncedKeg = require('../kegs/synced-keg');
const { observable } = require('mobx');

class FileFoldersKeg extends SyncedKeg {
    constructor(db) {
        super('file_folders', db);
        this.onUpdated = () => {
            console.log(`file folders updated: ${this.loaded}`);
        };
    }

    @observable formatVersion;
    @observable folders = [];

    serializeKegPayload() {
        const { formatVersion, folders } = this;
        return { formatVersion, folders };
    }

    deserializeKegPayload(payload) {
        console.log('file-folders-keg');
        console.log(payload);
        const { formatVersion, folders } = payload;
        Object.assign(this, { formatVersion, folders });
    }
}

module.exports = FileFoldersKeg;
