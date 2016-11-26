const { observable, action, reaction, asFlat } = require('mobx');
const socket = require('../network/socket');
// const normalize = require('../errors').normalize;
const User = require('./user');
// const updateTracker = require('./update-tracker');
const File = require('./file');

class FileStore {
    @observable files = asFlat([]); // todo: this needs to be asFlat(?) - but check for props update in FileLine
    @observable loading = false;
    loaded = false;

    _getFiles(min) {
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion: min || 0,
            query: { type: 'file' /* deleted: 'true' */}
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this._getFiles().then(action(kegs => {
            for (const keg of kegs) {
                const file = new File(User.current.kegdb);
                file.loadFromKeg(keg);
                // todo: remove after server fixes query by deleted
                if (!file.deleted) this.files.push(file);
            }
            this.loading = false;
            this.loaded = true;
        }));
    }

    /**
     *
     * @param {string} filePath
     */
    upload(filePath) {
        const keg = new File(User.current.kegdb);
        keg.upload(filePath);
        this.files.unshift(keg);
    }

    remove(file) {
        // todo: re-add on fail? notify
        this.files.remove(file);
        file.remove();
    }

    cancelUpload(file) {
        this.remove(file);
        file.cancelUpload();
    }


}

module.exports = new FileStore();
