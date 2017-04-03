const { observable, action, when, reaction, computed, autorunAsync } = require('mobx');
const socket = require('../../network/socket');
const User = require('../user/user');
const File = require('./file');
const systemWarnings = require('../system-warning');
const tracker = require('../update-tracker');
const TinyDb = require('../../db/tiny-db');
const config = require('../../config');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');

class FileStore {
    @observable files = observable.shallowArray([]);
    @observable loading = false;
    @observable ongoingUploads = 0;
    @observable completedUploads = 0;
    @observable currentFilter = '';
    // file store needs to know when it's considered 'active' meaning that user is looking at the file list.
    // Currently we need this to mark files as 'read' after a while.
    @observable active = false;
    loaded = false;
    updating = false;
    maxUpdateId = '';
    knownUpdateId = '';

    @observable unreadFiles = tracker.getDigest('SELF', 'file').newKegsCount;

    static isFileSelected(file) {
        return file.selected;
    }

    @computed get hasSelectedFiles() {
        return this.files.some(FileStore.isFileSelected);
    }
    @computed get allVisibleSelected() {
        for (let i = 0; i < this.files.length; i++) {
            if (!this.files[i].show) continue;
            if (this.files[i].selected === false) return false;
        }
        return true;
    }
    @computed get selectedCount() {
        let ret = 0;
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].selected) ret += 1;
        }
        return ret;
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
            const file = this.files[i];
            if (!file.show || !file.readyForDownload) continue;
            this.files[i].selected = true;
        }
    }

    @action filterByName(query) {
        this.currentFilter = query;
        const regex = new RegExp(_.escapeRegExp(query), 'i');
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = regex.test(this.files[i].name);
            if (!this.files[i].show) this.files[i].selected = false;
        }
    }

    @action clearFilter() {
        this.currentFilter = '';
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = true;
        }
    }


    /**
     * Attach handlers that will alert the user when a busy upload queue is
     * consumed.
     */
    constructor() {
        tracker.onKegTypeUpdated('SELF', 'file', () => {
            console.log('Files update event received');
            this.onFileDigestUpdate();
        });
        reaction(() => this.ongoingUploads, () => {
            if (this.ongoingUploads === 0) return;
            const currentCompletedUploads = this.completedUploads;
            when(() => this.ongoingUploads === 0, () => {
                (this.completedUploads > currentCompletedUploads) && systemWarnings.add({
                    content: 'snackbar_uploadComplete'
                });
            });
        });
    }

    onFileDigestUpdate = () => {
        const digest = tracker.getDigest('SELF', 'file');
        console.log(`Files digest: ${JSON.stringify(digest)}`);
        this.unreadFiles = digest.newKegsCount;
        if (digest.maxUpdateId === this.maxUpdateId) return;
        this.maxUpdateId = digest.maxUpdateId;
        this.updateFiles();
    };

    _getFiles() {
        const query = { type: 'file' };
        if (this.knownUpdateId === '') query.deleted = false;
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion: this.knownUpdateId,
            query
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        retryUntilSuccess(() => this._getFiles(), 'Initial file list loading')
            .then(action(kegs => {
                for (const keg of kegs) {
                    const file = new File(User.current.kegDb);
                    if (keg.collectionVersion > this.maxUpdateId) {
                        this.maxUpdateId = keg.collectionVersion;
                    }
                    if (file.loadFromKeg(keg)) this.files.push(file);
                }
                this.loading = false;
                this.loaded = true;
                this.resumeBrokenDownloads();
                this.resumeBrokenUploads();
                this.detectCachedFiles();
                socket.onAuthenticated(() => {
                    this.onFileDigestUpdate();
                    setTimeout(() => {
                        if (socket.authenticated) {
                            this.resumeBrokenDownloads();
                            this.resumeBrokenUploads();
                        }
                    }, 3000);
                });
                autorunAsync(() => {
                    if (this.unreadFiles === 0 || !this.active) return;
                    tracker.seenThis('SELF', 'file', this.knownUpdateId);
                }, 700);
                setTimeout(this.updateFiles);
            }));
    }

    // this essentially does the same as loadAllFiles but with filter,
    // we reserve this way of updating anyway for future, when we'll not gonna load entire file list on start
    updateFiles = () => {
        if (!this.loaded || this.updating) return;
        console.log(`Proceeding to file update. Known collection version: ${this.maxUpdateId}`);
        this.updating = true;
        retryUntilSuccess(() => this._getFiles(this.maxUpdateId), 'Updating file list')
            .then(action(kegs => {
                for (const keg of kegs) {
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    } else continue;
                    const existing = this.getById(keg.props.fileId);
                    const file = existing || new File(User.current.kegDb);
                    if (keg.isEmpty || !file.loadFromKeg(keg)) continue;
                    if (!file.deleted && !existing) this.files.push(file);
                    if (file.deleted && existing) this.files.remove(file);
                }
                this.updating = false;
                // in case we missed another event while updating
                if (kegs.length) setTimeout(this.onFileDigestUpdate);
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
        this.ongoingUploads++; // todo: this crap will not play nice with resume after app restart
        const keg = new File(User.current.kegDb);
        keg.upload(filePath, fileName);
        this.files.unshift(keg);

        const disposer = when(() => keg.deleted, () => {
            this.ongoingUploads--;
            this.files.remove(keg);
        });
        when(() => keg.readyForDownload, () => {
            this.ongoingUploads--;
            disposer();
        });

        return keg;
    }

    resumeBrokenDownloads() {
        console.log('Checking for interrupted downloads.');
        const regex = /^DOWNLOAD:(.*)$/;
        TinyDb.user.getAllKeys()
            .then(keys => {
                for (let i = 0; i < keys.length; i++) {
                    const match = regex.exec(keys[i]);
                    if (!match || !match[1]) continue;
                    const file = this.getById(match[1]);
                    if (file) {
                        console.log(`Requesting download resume for ${keys[i]}`);
                        TinyDb.user.getValue(keys[i]).then(dlInfo => file.download(dlInfo.path, true));
                    }
                }
            });
    }

    resumeBrokenUploads() {
        console.log('Checking for interrupted uploads.');
        const regex = /^UPLOAD:(.*)$/;
        TinyDb.user.getAllKeys()
            .then(keys => {
                for (let i = 0; i < keys.length; i++) {
                    const match = regex.exec(keys[i]);
                    if (!match || !match[1]) continue;
                    const file = this.getById(match[1]);
                    if (file) {
                        console.log(`Requesting upload resume for ${keys[i]}`);
                        TinyDb.user.getValue(keys[i]).then(dlInfo => file.upload(dlInfo.path, null, true));
                    }
                }
            });
    }

    detectCachedFiles() {
        if (!config.isMobile || this.files.length === 0) return;
        let c = this.files.length - 1;
        const checkFile = () => {
            if (c < 0) return;
            const file = this.files[c];
            if (file && !file.downloading) {
                config.FileStream.exists(file.cachePath)
                    .then(v => (file.cached = !!v));
            }
            c--;
            setTimeout(checkFile);
        };
        checkFile();
    }

}

module.exports = new FileStore();
