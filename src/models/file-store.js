const { observable, action, asFlat, when, reaction, computed } = require('mobx');
const socket = require('../network/socket');
// const normalize = require('../errors').normalize;
const User = require('./user');
// const updateTracker = require('./update-tracker');
const File = require('./file');
const systemWarnings = require('./system-warning');
const tracker = require('./update-tracker');
const _ = require('lodash');

class FileStore {
    @observable files = asFlat([]);
    @observable loading = false;
    @observable ongoingUploads = 0;
    loaded = false;
    updating = false;
    knownCollectionVersion = 0;

    static isFileSelected(file) {
        return file.selected;
    }

    @computed get hasSelectedFiles() {
        return this.files.some(FileStore.isFileSelected);
    }
    @computed get allSelected() {
        return this.files.every(FileStore.isFileSelected);
    }

    /**
     * Returns currently selected files (file.selected == true)
     * @returns {Array<File>}
     */
    getSelectedFiles() {
        return this.files.filter(FileStore.isFileSelected);
    }

    /**
     * Deselects all files
     */
    @action clearSelection() {
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].selected = false;
        }
    }

    @action selectAll() {
        for (let i = 0; i < this.files.length; i++) {
            if (!this.files[i].show) continue;
            this.files[i].selected = true;
        }
    }

    @action filterByName(query) {
        const regex = new RegExp(_.escapeRegExp(query), 'i');
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = regex.test(this.files[i].name);
            if (!this.files[i].show) this.files[i].selected = false;
        }
    }

    @action clearFilter() {
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = true;
        }
    }


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

    _getFiles(minCollectionVersion = 0) {
        const query = { type: 'file' };
        if (minCollectionVersion === 0) query.deleted = 'false';
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion,
            query
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        this._getFiles().then(action(kegs => {
            for (const keg of kegs) {
                const file = new File(User.current.kegdb);
                this.knownCollectionVersion = Math.max(this.knownCollectionVersion, keg.collectionVersion);
                if (file.loadFromKeg(keg)) this.files.push(file);
            }
            this.loading = false;
            this.loaded = true;
            tracker.onKegTypeUpdated('SELF', 'file', this.updateFiles);
            setTimeout(this.updateFiles);
        }));
    }

    resume() {
        when(() => !this.loading, () => {
            console.log('file-store.js: resuming');
            this.files.forEach(f => {
                // when file finished checking its download status
                when(() => f.isPartialDownload, () => f.download());
                when(() => f.nonce && f.isPartialUpload, () => f.upload());
            });
        });
    }

    // this essentially does the same as loadAllFiles but with filter,
    // we reserve this way of updating anyway for future, when we'll not gonna load entire file list on start
    updateFiles = () => {
        console.log(`Files update event received ${JSON.stringify(tracker.digest.SELF.file)}`);
        if (this.updating) return;
        console.log(`Proceeding to file update. Known collection version: ${this.knownCollectionVersion}`);
        this.updating = true;
        this._getFiles(this.knownCollectionVersion + 1)
            .then(action(kegs => {
                for (const keg of kegs) {
                    console.log(keg);
                    const existing = this.getById(keg.props.fileId);
                    const file = existing || new File(User.current.kegdb);
                    this.knownCollectionVersion = Math.max(this.knownCollectionVersion, keg.collectionVersion);
                    if (!file.loadFromKeg(keg)) continue;
                    if (!file.deleted && !existing) this.files.push(file);
                    if (file.deleted && existing) this.files.remove(file);
                }
                this.updating = false;
                // in case we missed another event while updating
                if (kegs.length) setTimeout(this.updateFiles);
            }));
    };

    // todo; file map
    getById(fileId) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].fileId === fileId) return this.files[i];
        }
        return null;
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
        // this.files.remove(file);
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
