const { observable, action, asFlat } = require('mobx');
const socket = require('../network/socket');
// const normalize = require('../errors').normalize;
const User = require('./user');
// const updateTracker = require('./update-tracker');
const File = require('./file');

class FileStore {
    @observable files = asFlat([]);
    @observable loading = false;
    loaded = false;

    _getFiles(min) {
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion: min || 0,
            query: { type: 'file', deleted: 'false' }
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        this._getFiles().then(action(kegs => {
            this.files.clear();
            for (const keg of kegs) {
                const file = new File(User.current.kegdb);
                file.loadFromKeg(keg);
                // todo: remove after server fixes query by deleted
                this.files.push(file);
            }
            this.loading = false;
            this.loaded = true;
        }));
    }

    // todo: should work with updates
    reloadAllFiles() {
        this.loaded = false;
        this.loadAllFiles();
    }

    /**
     *
     * @param {string} filePath
     * @param {string} fileName
     */
    upload(filePath, fileName) {
        const keg = new File(User.current.kegdb);
        keg.upload(filePath, fileName);
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

    cancelDownload(file) {
        file.cancelUpload();
    }

}

module.exports = new FileStore();
