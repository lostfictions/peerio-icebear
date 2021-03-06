'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

const { observable, action, when, reaction, computed } = require('mobx');
const socket = require('../../network/socket');
const User = require('../user/user');
const File = require('./file');
const warnings = require('../warnings');
const tracker = require('../update-tracker');
const TinyDb = require('../../db/tiny-db');
const config = require('../../config');
const util = require('../../util');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');
const clientApp = require('../client-app');
const TaskQueue = require('../../helpers/task-queue');
const { setFileStore } = require('../../helpers/di-file-store');
const createMap = require('../../helpers/dynamic-array-map');

/**
 * File store.
 * @namespace
 * @public
 */
let FileStore = (_class = class FileStore {
    constructor() {
        _initDefineProp(this, 'files', _descriptor, this);

        this.inlineImageSizeLimitFormatted = util.formatBytes(config.chat.inlineImageSizeLimit);
        this.inlineImageSizeLimitCutoffFormatted = util.formatBytes(config.chat.inlineImageSizeLimitCutoff);

        _initDefineProp(this, 'loading', _descriptor2, this);

        _initDefineProp(this, 'updatedAfterReconnect', _descriptor3, this);

        _initDefineProp(this, 'currentFilter', _descriptor4, this);

        this.loaded = false;
        this.updating = false;
        this.maxUpdateId = '';
        this.knownUpdateId = '';
        this.uploadQueue = new TaskQueue(1);

        _initDefineProp(this, 'unreadFiles', _descriptor5, this);

        this.onFileDigestUpdate = _.throttle(() => {
            const digest = tracker.getDigest('SELF', 'file');
            console.log(`Files digest: ${JSON.stringify(digest)}`);
            // this.unreadFiles = digest.newKegsCount;
            if (digest.maxUpdateId === this.maxUpdateId) {
                this.updatedAfterReconnect = true;
                return;
            }
            this.maxUpdateId = digest.maxUpdateId;
            this.updateFiles(this.maxUpdateId);
        }, 1500);

        this.loadAllFiles = () => {
            if (this.loading || this.loaded) return;
            console.time('loadAllFiles');
            this.loading = true;
            retryUntilSuccess(() => this._getFiles(), 'Initial file list loading').then(action(kegs => {
                for (const keg of kegs.kegs) {
                    const file = new File(User.current.kegDb);
                    if (keg.collectionVersion > this.maxUpdateId) {
                        this.maxUpdateId = keg.collectionVersion;
                    }
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    }
                    if (file.loadFromKeg(keg)) {
                        if (!file.fileId) {
                            console.error('File keg missing fileId', file.id);
                            continue;
                        }
                        if (this.fileMap[file.fileId]) {
                            console.error('File keg has duplicate fileId', file.id);
                            continue;
                        }
                        this.files.unshift(file);
                    } else {
                        console.error('Failed to load file keg', keg.kegId);
                        continue;
                    }
                }
                this.loading = false;
                this.loaded = true;
                this.resumeBrokenDownloads();
                this.resumeBrokenUploads();
                this.detectCachedFiles();
                socket.onDisconnect(() => {
                    this.updatedAfterReconnect = false;
                });
                socket.onAuthenticated(() => {
                    this.onFileDigestUpdate();
                    setTimeout(() => {
                        if (socket.authenticated) {
                            this.resumeBrokenDownloads();
                            this.resumeBrokenUploads();
                        }
                    }, 3000);
                    for (let i = 0; i < this.files.length; i++) {
                        if (this.files[i].cachingFailed) {
                            this.files[i].cachingFailed = false;
                        }
                    }
                });
                reaction(() => this.unreadFiles === 0 || !clientApp.isInFilesView || !clientApp.isFocused, dontReport => {
                    if (dontReport) return;
                    tracker.seenThis('SELF', 'file', this.knownUpdateId);
                }, { fireImmediately: true, delay: 700 });
                setTimeout(this.updateFiles);
                console.timeEnd('loadAllFiles');
            }));
        };

        this.updateFiles = maxId => {
            if (!this.loaded || this.updating) return;
            if (!maxId) maxId = this.maxUpdateId; // eslint-disable-line
            console.log(`Proceeding to file update. Known collection version: ${this.knownUpdateId}`);
            this.updating = true;
            let dirty = false;
            retryUntilSuccess(() => this._getFiles(), 'Updating file list').then(action(resp => {
                const kegs = resp.kegs;
                for (const keg of kegs) {
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    }
                    if (!keg.props.fileId) {
                        console.error('File keg missing fileId', keg.kegId);
                        continue;
                    }
                    const existing = this.getById(keg.props.fileId);
                    const file = existing || new File(User.current.kegDb);
                    if (keg.deleted) {
                        if (existing) this.files.remove(existing);
                        continue;
                    }
                    if (!file.loadFromKeg(keg) || file.isEmpty) continue;
                    if (!existing) {
                        dirty = true;
                        this.files.unshift(file);
                    }
                }
                this.updating = false;
                if (dirty) {
                    this.resumeBrokenDownloads();
                    this.resumeBrokenUploads();
                }
                // need this because if u delete all files knownUpdateId won't be set at all after initial load
                if (this.knownUpdateId < maxId) this.knownUpdateId = maxId;
                // in case we missed another event while updating
                if (kegs.length || this.maxUpdateId && this.knownUpdateId < this.maxUpdateId) {
                    setTimeout(this.updateFiles);
                } else {
                    setTimeout(this.onFileDigestUpdate);
                }
                this.updatedAfterReconnect = true;
            }));
        };

        this.upload = (filePath, fileName) => {
            const keg = new File(User.current.kegDb);
            config.FileStream.getStat(filePath).then(stat => {
                if (!User.current.canUploadFileSize(stat.size)) {
                    keg.deleted = true;
                    warnings.addSevere('error_fileQuotaExceeded', 'error_uploadFailed');
                    return;
                }
                if (!User.current.canUploadMaxFileSize(stat.size)) {
                    keg.deleted = true;
                    warnings.addSevere('error_fileUploadSizeExceeded', 'error_uploadFailed');
                    return;
                }
                this.uploadQueue.addTask(() => {
                    const ret = keg.upload(filePath, fileName);
                    this.files.unshift(keg);

                    const disposer = when(() => keg.deleted, () => {
                        this.files.remove(keg);
                    });
                    when(() => keg.readyForDownload, () => {
                        disposer();
                    });
                    return ret;
                });
            });

            return keg;
        };

        const m = createMap(this.files, 'fileId');
        this.fileMap = m.map;
        this.fileMapObservable = m.observableMap;

        tracker.onKegTypeUpdated('SELF', 'file', () => {
            console.log('Files update event received');
            this.onFileDigestUpdate();
        });
    }
    /**
     * Full list of user's files.
     * @member {ObservableArray<File>} files
     * @memberof FileStore
     * @instance
     * @public
     */


    /**
     * Subset of files not currently hidden by any applied filters
     * @readonly
     * @memberof FileStore
     */
    get visibleFiles() {
        return this.files.filter(f => f.show);
    }

    /**
     * Human readable maximum auto-expandable inline image size limit
     * @readonly
     * @memberof FileStore
     */


    /**
     * Human readable maximum cutoff inline image size limit
     * @readonly
     * @memberof FileStore
     */


    /**
     * Store is loading full file list for the first time.
     * @member {boolean} loading
     * @memberof FileStore
     * @instance
     * @public
     */

    /**
     * Will set to true after file list has been updated upon reconnect.
     * @member {boolean} updatedAfterReconnect
     * @memberof FileStore
     * @instance
     * @public
     */

    /**
     * Readonly, shows which keyword was used with last call to `filter()`, this need refactoring.
     * @member {string} currentFilter
     * @memberof FileStore
     * @instance
     * @public
     */

    /**
     * Initial file list was loaded, this is not observable property.
     * @member {boolean}
     * @protected
     */

    /**
     * Currently updating file list from server, this is not observable property.
     * @member {boolean}
     * @public
     */

    /**
     * Readonly
     * @member {TaskQueue} uploadQueue
     * @public
     */


    /**
     * @ignore
     * This will go away soon.
     */
    // tracker.getDigest('SELF', 'file').newKegsCount;

    // optimization to avoid creating functions every time
    static isFileSelected(file) {
        return file.selected;
    }

    // optimization to avoid creating functions every time
    static isSelectedFileShareable(file) {
        return !file.selected ? true : file.canShare;
    }

    // optimization to avoid creating functions every time
    static isFileShareable(file) {
        return file.canShare;
    }

    /**
     * @member {boolean} hasSelectedFiles
     * @memberof FileStore
     * @instance
     * @public
     */
    get hasSelectedFiles() {
        return this.files.some(FileStore.isFileSelected);
    }

    /**
     * @member {boolean} canShareSelectedFiles
     * @memberof FileStore
     * @instance
     * @public
     */
    get canShareSelectedFiles() {
        return this.hasSelectedFiles && this.files.every(FileStore.isSelectedFileShareable);
    }

    /**
     * @member {boolean} allVisibleSelected
     * @memberof FileStore
     * @instance
     * @public
     */
    get allVisibleSelected() {
        for (let i = 0; i < this.files.length; i++) {
            if (!this.files[i].show) continue;
            if (this.files[i].selected === false) return false;
        }
        return true;
    }

    /**
     * @member {number} selectedCount
     * @memberof FileStore
     * @instance
     * @public
     */
    get selectedCount() {
        let ret = 0;
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].selected) ret += 1;
        }
        return ret;
    }

    /**
     * Returns currently selected files (file.selected == true)
     * @returns {Array<File>}
     * @public
     */
    getSelectedFiles() {
        return this.files.filter(FileStore.isFileSelected);
    }

    /**
     * Returns currently selected files that are also shareable.
     * @returns {Array<File>}
     * @public
     */
    getShareableSelectedFiles() {
        return this.files.filter(FileStore.isFileSelectedAndShareable);
    }

    /**
     * Deselects all files
     * @function clearSelection
     * @memberof FileStore
     * @instance
     * @public
     */
    clearSelection() {
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].selected = false;
        }
    }

    /**
     * Selects all files
     * @function selectAll
     * @memberof FileStore
     * @instance
     * @public
     */
    selectAll() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            if (!file.show || !file.readyForDownload) continue;
            this.files[i].selected = true;
        }
    }

    /**
     * Deselects unshareable files
     * @function deselectUnshareableFiles
     * @memberof FileStore
     * @instance
     * @public
     */
    deselectUnshareableFiles() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            if (file.canShare) continue;
            if (file.selected) file.selected = false;
        }
    }

    /**
     * Applies filter to files.
     * @function filterByName
     * @param {string} query
     * @memberof FileStore
     * @instance
     * @public
     */
    filterByName(query) {
        this.currentFilter = query;
        const regex = new RegExp(_.escapeRegExp(query), 'i');
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = regex.test(this.files[i].name);
            if (!this.files[i].show) this.files[i].selected = false;
        }
    }

    /**
     * Resets filter
     * @function clearFilter
     * @memberof FileStore
     * @instance
     * @public
     */
    clearFilter() {
        this.currentFilter = '';
        for (let i = 0; i < this.files.length; i++) {
            this.files[i].show = true;
        }
    }

    _getFiles() {
        const filter = this.knownUpdateId ? { minCollectionVersion: this.knownUpdateId } : {};
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

    /**
     * Call at least once from UI.
     * @public
     */


    // this essentially does the same as loadAllFiles but with filter,
    // we reserve this way of updating anyway for future, when we'll not gonna load entire file list on start


    /**
     * Finds file by fileId.
     * @param {string} fileId
     * @returns {?File}
     * @public
     */
    getById(fileId) {
        return this.fileMapObservable.get(fileId);
    }

    /**
     * Start new file upload and get the file keg for it.
     * @function upload
     * @param {string} filePath - full path with name
     * @param {string} [fileName] - if u want to override name in filePath
     * @public
     */


    /**
     * Resumes interrupted downloads if any.
     * @protected
     */
    resumeBrokenDownloads() {
        if (!this.loaded) return;
        console.log('Checking for interrupted downloads.');
        const regex = /^DOWNLOAD:(.*)$/;
        TinyDb.user.getAllKeys().then(keys => {
            for (let i = 0; i < keys.length; i++) {
                const match = regex.exec(keys[i]);
                if (!match || !match[1]) continue;
                const file = this.getById(match[1]);
                if (file) {
                    console.log(`Requesting download resume for ${keys[i]}`);
                    TinyDb.user.getValue(keys[i]).then(dlInfo => file.download(dlInfo.path, true));
                } else {
                    TinyDb.user.removeValue(keys[i]);
                }
            }
        });
    }

    /**
     * Resumes interrupted uploads if any.
     * @protected
     */
    resumeBrokenUploads() {
        console.log('Checking for interrupted uploads.');
        const regex = /^UPLOAD:(.*)$/;
        TinyDb.user.getAllKeys().then(keys => {
            for (let i = 0; i < keys.length; i++) {
                const match = regex.exec(keys[i]);
                if (!match || !match[1]) continue;
                const file = this.getById(match[1]);
                if (file) {
                    console.log(`Requesting upload resume for ${keys[i]}`);
                    TinyDb.user.getValue(keys[i]).then(dlInfo => {
                        return this.uploadQueue.addTask(() => file.upload(dlInfo.path, null, true));
                    });
                }
            }
        });
    }
    // sets file.cached flag for mobile
    detectCachedFiles() {
        if (!config.isMobile || this.files.length === 0) return;
        let c = this.files.length - 1;
        const checkFile = () => {
            if (c < 0) return;
            const file = this.files[c];
            if (file && !file.downloading) {
                config.FileStream.exists(file.cachePath).then(v => {
                    file.cached = !!v;
                });
            }
            c--;
            setTimeout(checkFile);
        };
        checkFile();
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'files', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowArray([]);
    }
}), _applyDecoratedDescriptor(_class.prototype, 'visibleFiles', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'visibleFiles'), _class.prototype), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'loading', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'updatedAfterReconnect', [observable], {
    enumerable: true,
    initializer: function () {
        return true;
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'currentFilter', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'unreadFiles', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'hasSelectedFiles', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasSelectedFiles'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'canShareSelectedFiles', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'canShareSelectedFiles'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'allVisibleSelected', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'allVisibleSelected'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'selectedCount', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'selectedCount'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'clearSelection', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'clearSelection'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'selectAll', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'selectAll'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deselectUnshareableFiles', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deselectUnshareableFiles'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'filterByName', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'filterByName'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'clearFilter', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'clearFilter'), _class.prototype)), _class);

const ret = new FileStore();
setFileStore(ret);
module.exports = ret;