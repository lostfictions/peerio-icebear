const { observable, action, asFlat, when, reaction } = require('mobx');
const socket = require('../network/socket');
// const normalize = require('../errors').normalize;
const User = require('./user');
// const updateTracker = require('./update-tracker');
const File = require('./file');
const systemWarnings = require('./system-warning');

class FileStore {
    @observable files = asFlat([]);
    @observable loading = false;
    @observable ongoingUploads = 0;
    loaded = false;

    /**
     * Attach handlers that will alert the user when a busy upload queue is
     * consumed.
     */
    constructor() {
        reaction(() => this.ongoingUploads, () => {
            if (this.ongoingUploads > 0) {
                when(() => this.ongoingUploads === 0, () => {
                    systemWarnings.add({
                        content: 'file_uploadComplete'
                    });
                });
            }
        });
    }

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
     * Upload a file and keep track of its uploading state.
     *
     * @param {string} filePath
     * @param {string} fileName
     */
    upload(filePath, fileName) {
        this.ongoingUploads += 1;
        const keg = new File(User.current.kegdb);
        keg.upload(filePath, fileName);
        this.files.unshift(keg);

        when(() => !keg.uploading, () => {
            this.ongoingUploads -= 1;
        });
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
