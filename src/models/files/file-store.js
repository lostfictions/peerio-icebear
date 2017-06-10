
const { observable, action, when, reaction, computed } = require('mobx');
const socket = require('../../network/socket');
const User = require('../user/user');
const File = require('./file');
const warnings = require('../warnings');
const tracker = require('../update-tracker');
const TinyDb = require('../../db/tiny-db');
const config = require('../../config');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');
const clientApp = require('../client-app');
// const chatStore

class FileStore {
    @observable files = observable.shallowArray([]);
    @observable loading = false;
    @observable currentFilter = '';
    loaded = false;
    updating = false;
    maxUpdateId = '';
    knownUpdateId = '';

    @observable unreadFiles = 0;// tracker.getDigest('SELF', 'file').newKegsCount;

    static isFileSelected(file) {
        return file.selected;
    }

    static isSelectedFileShareable(file) {
        return !file.selected ? true : file.canShare;
    }

    static isFileShareable(file) {
        return file.canShare;
    }

    @computed get hasSelectedFiles() {
        return this.files.some(FileStore.isFileSelected);
    }

    @computed get canShareSelectedFiles() {
        return this.hasSelectedFiles && this.files.every(FileStore.isSelectedFileShareable);
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

    getShareableSelectedFiles() {
        return this.files.filter(FileStore.isFileSelectedAndShareable);
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

    @action deselectUnshareableFiles() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            if (file.canShare) continue;
            if (file.selected) file.selected = false;
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
    }

    onFileDigestUpdate = _.throttle(() => {
        const digest = tracker.getDigest('SELF', 'file');
        console.log(`Files digest: ${JSON.stringify(digest)}`);
        // this.unreadFiles = digest.newKegsCount;
        if (digest.maxUpdateId === this.maxUpdateId) return;
        this.maxUpdateId = digest.maxUpdateId;
        this.updateFiles(this.maxUpdateId);
    }, 1500);

    _getFiles() {
        const filter = { minCollectionVersion: this.knownUpdateId };
        if (this.knownUpdateId === '') filter.deleted = false;

        return socket.send('/auth/kegs/db/list-ext', {
            kegDbId: 'SELF',
            options: {
                type: 'file',
                reverse: false
            },
            filter
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        retryUntilSuccess(() => this._getFiles(), 'Initial file list loading')
            .then(action(kegs => {
                for (const keg of kegs.kegs) {
                    const file = new File(User.current.kegDb);
                    if (keg.collectionVersion > this.maxUpdateId) {
                        this.maxUpdateId = keg.collectionVersion;
                    }
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    }
                    if (file.loadFromKeg(keg)) this.files.unshift(file);
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
                reaction(() => this.unreadFiles === 0 || !clientApp.isInFilesView || !clientApp.isFocused,
                    (dontReport) => {
                        if (dontReport) return;
                        tracker.seenThis('SELF', 'file', this.knownUpdateId);
                    }, { fireImmediately: true, delay: 700 });
                setTimeout(this.updateFiles);
            }));
    }

    // this essentially does the same as loadAllFiles but with filter,
    // we reserve this way of updating anyway for future, when we'll not gonna load entire file list on start
    updateFiles = (maxId) => {
        if (!this.loaded || this.updating) return;
        if (!maxId) maxId = this.maxUpdateId; // eslint-disable-line
        console.log(`Proceeding to file update. Known collection version: ${this.knownUpdateId}`);
        this.updating = true;
        retryUntilSuccess(() => this._getFiles(), 'Updating file list')
            .then(action(resp => {
                const kegs = resp.kegs;
                for (const keg of kegs) {
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    }
                    const existing = this.getById(keg.props.fileId);
                    const file = existing || new File(User.current.kegDb);
                    if (keg.deleted && existing) {
                        this.files.remove(existing);
                        continue;
                    }
                    if (keg.isEmpty || !file.loadFromKeg(keg)) continue;
                    if (!file.deleted && !existing) this.files.unshift(file);
                }
                this.updating = false;
                // need this bcs if u delete all files knownUpdateId won't be set at all after initial load
                if (this.knownUpdateId < maxId) this.knownUpdateId = maxId;
                // in case we missed another event while updating
                if (kegs.length || (this.maxUpdateId && this.knownUpdateId < this.maxUpdateId)) {
                    setTimeout(this.updateFiles);
                } else {
                    setTimeout(this.onFileDigestUpdate);
                }
            }));
    };

    // todo: file map
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
        const keg = new File(User.current.kegDb);
        config.FileStream.getStat(filePath).then(stat => {
            if (!User.current.canUploadFileSize(stat.size)) {
                keg.deleted = true;
                warnings.addSevere('error_fileQuotaExceeded', 'error_uploadFailed');
                return;
            }
            keg.upload(filePath, fileName);
            this.files.unshift(keg);

            const disposer = when(() => keg.deleted, () => {
                this.files.remove(keg);
            });
            when(() => keg.readyForDownload, () => {
                disposer();
            });
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
