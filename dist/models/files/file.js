'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16;

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

const Keg = require('./../kegs/keg');
const { observable, computed, action, isObservableArray } = require('mobx');
const { cryptoUtil, secret } = require('../../crypto');
const fileHelper = require('../../helpers/file');
const util = require('../../util');
const config = require('../../config');
const socket = require('../../network/socket');
const uploadModule = require('./file.upload');
const downloadModule = require('./file.download');
const { getUser } = require('../../helpers/di-current-user');
const { retryUntilSuccess } = require('../../helpers/retry');
const { ServerError } = require('../../errors');
const clientApp = require('../client-app');

const IMAGE_EXTS = { png: true, jpg: true, jpeg: true, bmp: true, gif: true };
/**
 * File keg and model.
 * @param {KegDb} db
 * @extends {Keg}
 * @public
 */
let File = (_class = class File extends Keg {
    constructor(db) {
        super(null, 'file', db);

        _initDefineProp(this, 'fileId', _descriptor, this);

        _initDefineProp(this, 'name', _descriptor2, this);

        _initDefineProp(this, 'size', _descriptor3, this);

        _initDefineProp(this, 'uploadedAt', _descriptor4, this);

        _initDefineProp(this, 'fileOwner', _descriptor5, this);

        _initDefineProp(this, 'cachingFailed', _descriptor6, this);

        _initDefineProp(this, 'readyForDownload', _descriptor7, this);

        _initDefineProp(this, 'uploading', _descriptor8, this);

        _initDefineProp(this, 'downloading', _descriptor9, this);

        _initDefineProp(this, 'progress', _descriptor10, this);

        _initDefineProp(this, 'progressMax', _descriptor11, this);

        _initDefineProp(this, 'cached', _descriptor12, this);

        _initDefineProp(this, 'tmpCached', _descriptor13, this);

        _initDefineProp(this, 'selected', _descriptor14, this);

        _initDefineProp(this, 'show', _descriptor15, this);

        _initDefineProp(this, 'shared', _descriptor16, this);
    }

    /**
     * Blob key
     * @member {Uint8Array}
     * @public
     */

    /**
     * Blob nonce. It's separate because this is a base nonce, every chunk adds its number to it to decrypt.
     * @member {Uint8Array}
     * @public
     */

    /**
     * System-wide unique client-generated id
     * @member {string} fileId
     * @memberof File
     * @instance
     * @public
     */

    /**
     * @member {string} name
     * @memberof File
     * @instance
     * @public
     */

    /**
     * Bytes
     * @member {number} size
     * @memberof File
     * @instance
     * @public
     */

    /**
     * @member {number} uploadedAt
     * @memberof File
     * @instance
     * @public
     */


    /**
     * Username uploaded this file.
     * @member {string} fileOwner
     * @memberof File
     * @instance
     * @public
     */


    /**
     * Indicates if last caching attempt failed
     * @memberof File
     */


    // -- View state data ----------------------------------------------------------------------------------------
    // Depends on server set property 'fileProcessingState'
    /**
     * When this is 'true' file is ready to be downloaded. Upload finishes before that,
     * then server needs some time to process file.
     * @member {boolean} readyForDownload
     * @memberof File
     * @instance
     * @public
     */

    /**
     * @member {boolean} uploading
     * @memberof File
     * @instance
     * @public
     */

    /**
     * @member {boolean} downloading
     * @memberof File
     * @instance
     * @public
     */

    /**
     * Upload or download progress value in bytes. Note that when uploading it doesn't count overhead.
     * @member {number} progress
     * @memberof File
     * @instance
     * @public
     */

    /**
     * File size with overhead for downloads and without overhead for uploads.
     * @member {number} progressMax
     * @memberof File
     * @instance
     * @public
     */

    /**
     * currently mobile only: flag means file was downloaded and is available locally
     * @member {boolean} cached
     * @memberof File
     * @instance
     * @public
     */


    /**
     * Is this file selected in file pickers for group operations.
     * It's a bit weird mix of UI state and logic, but it works fine at the moment,
     * we'll rethink it when we implement folders.
     * @member {boolean} selected
     * @memberof File
     * @instance
     * @public
     */

    /**
     * Is this file visible or filtered by search. Also weird, needs refactor.
     * @member {boolean} show
     * @memberof File
     * @instance
     * @public
     */

    /**
     * Is this file currently shared with anyone.
     * @member {boolean} shared
     * @memberof File
     * @instance
     * @public
     */


    // -- computed properties ------------------------------------------------------------------------------------
    /**
     * file extension
     * @member {string} ext
     * @memberof File
     * @instance
     * @public
     */
    get ext() {
        return fileHelper.getFileExtension(this.name);
    }

    /**
     * file icon type
     * @member {string} ext
     * @memberof File
     * @instance
     * @public
     */
    get iconType() {
        return fileHelper.getFileIconType(this.ext);
    }

    /**
     * @member {string} nameWithoutExt
     * @memberof File
     * @instance
     * @public
     */
    get nameWithoutExtension() {
        return fileHelper.getFileNameWithoutExtension(this.name);
    }

    get isImage() {
        return !!IMAGE_EXTS[this.ext];
    }

    get fsSafeUid() {
        return cryptoUtil.getHexHash(16, cryptoUtil.b64ToBytes(this.fileId));
    }
    get tmpCachePath() {
        return config.FileStream.getTempCachePath(`${this.fsSafeUid}.${this.ext}`);
    }
    /**
     * currently mobile only: Full path to locally stored file
     * @member {string} cachePath
     * @memberof File
     * @instance
     * @public
     */
    get cachePath() {
        if (!config.isMobile) return null;

        const name = `${this.name || this.fsSafeUid}.${this.ext}`;
        return config.FileStream.getFullPath(this.fsSafeUid, name);
    }
    /**
     * Human readable file size
     * @member {string} sizeFormatted
     * @memberof File
     * @instance
     * @public
     */
    get sizeFormatted() {
        return util.formatBytes(this.size);
    }

    /**
     * @member {number} chunksCount
     * @memberof File
     * @instance
     * @public
     */
    get chunksCount() {
        return Math.ceil(this.size / this.chunkSize);
    }

    /**
     * @member {boolean} canShare
     * @memberof File
     * @instance
     * @public
     */
    get canShare() {
        return true; // getUser().username === this.fileOwner;
    }
    /**
     * Bytes
     * @member {number}
     * @public
     */
    get sizeWithOverhead() {
        return this.size + this.chunksCount * config.CHUNK_OVERHEAD;
    }

    get isOverInlineSizeLimit() {
        return clientApp.uiUserPrefs.limitInlineImageSize && this.size > config.chat.inlineImageSizeLimit;
    }

    get isOversizeCutoff() {
        return this.size > config.chat.inlineImageSizeLimitCutoff;
    }

    serializeKegPayload() {
        return {
            name: this.name,
            key: this.key,
            nonce: this.nonce
        };
    }

    deserializeKegPayload(data) {
        this.name = data.name;
        this.key = data.key;
        this.nonce = data.nonce;
    }

    serializeProps() {
        return {
            fileId: this.fileId,
            size: this.size,
            ext: this.ext, // don't really need to store, since it's computed, but we want to search by extension
            uploadedAt: this.uploadedAt.valueOf(),
            chunkSize: this.chunkSize
        };
    }

    deserializeProps(props) {
        this.fileId = props.fileId;
        this.readyForDownload = props.fileProcessingState === 'ready' || !!props.sharedBy;
        this.size = +props.size;
        this.uploadedAt = new Date(+props.uploadedAt);
        this.fileOwner = props.owner || this.owner;
        this.sharedBy = props.sharedBy;
        this.chunkSize = +props.chunkSize;
        this.shared = props.shared;
    }

    /**
     * Share file with contacts
     * @param {Contact|Array<Contact>|ObservableArray<Contact>} contactOrContacts
     * @returns {Promise}
     * @public
     */
    share(contactOrContacts) {
        const contacts = Array.isArray(contactOrContacts) || isObservableArray(contactOrContacts) ? contactOrContacts : [contactOrContacts];

        // Generate a new random payload key.
        const payloadKey = cryptoUtil.getRandomBytes(32);

        // Serialize payload.
        const payload = JSON.stringify(this.serializeKegPayload());

        // Encrypt payload with the payload key.
        const encryptedPayload = secret.encryptString(payload, payloadKey);

        // Encrypt message key for each recipient's public key.
        //
        // {
        //   "user1": { "publicKey": ..., "encryptedKey": ... },
        //   "user2": { "publicKey": ..., "encryptedKey": ... }
        //   ...
        //  }
        //
        const recipients = {};
        contacts.forEach(contact => {
            recipients[contact.username] = {
                publicKey: cryptoUtil.bytesToB64(contact.encryptionPublicKey),
                encryptedPayloadKey: cryptoUtil.bytesToB64(secret.encrypt(payloadKey, getUser().getSharedKey(contact.encryptionPublicKey)))
            };
        });

        const data = {
            recipients,
            originalKegId: this.id,
            keg: {
                type: this.type,
                payload: encryptedPayload.buffer,
                // todo: this is questionable, could we leak properties we don't want to this way?
                // todo: on the other hand we can forget to add properties that we do want to share
                props: this.serializeProps()
            }
        };

        // when we implement key change history, this will help to figure out which key to use
        // this properties should not be blindly trusted, recipient verifies them
        data.keg.props.sharedKegSenderPK = cryptoUtil.bytesToB64(getUser().encryptionKeys.publicKey);

        return retryUntilSuccess(() => socket.send('/auth/kegs/share', data));
    }

    /**
     * Open file with system's default file type handler app.
     * @param {string} [path] - tries this.cachePath if path is not passed
     * @public
     */
    launchViewer(path) {
        return config.FileStream.launchViewer(path || this.cachePath);
    }

    /**
     * Remove locally stored file copy. Currently only mobile uses this.
     * @public
     */
    deleteCache() {
        config.FileSystem.delete(this.cachePath);
        this.cached = false;
    }
    /**
     * Remove file from cloud and unshare with everyone.
     * @returns {Promise}
     * @public
     */
    remove() {
        this._resetUploadState();
        this._resetDownloadState();
        if (!this.id) return Promise.resolve();
        return retryUntilSuccess(() => super.remove(), `remove file ${this.id}`, 3).then(() => {
            this.deleted = true;
        });
    }

    /**
     * Safe to call any time after upload has been started (keg created).
     * Retries a few times in case of error.
     * @param {string} newName
     * @returns {Promise}
     * @public
     */
    rename(newName) {
        return retryUntilSuccess(() => {
            this.name = newName;
            return this.saveToServer().catch(err => {
                if (err instanceof ServerError && err.code === ServerError.codes.malformedRequest) {
                    return this.load();
                }
                return Promise.reject(err);
            });
        }, 5);
    }

    tryToCacheTemporarily(force) {
        if (this.tmpCached || this.downloading || !clientApp.uiUserPrefs.peerioContentEnabled || !force && this.isOverInlineSizeLimit || this.isOversizeCutoff || this.cachingFailed) return;

        this.downloadToTmpCache();
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'fileId', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'name', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'size', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'uploadedAt', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'fileOwner', [observable], {
    enumerable: true,
    initializer: null
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'cachingFailed', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'readyForDownload', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, 'uploading', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, 'downloading', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, 'progress', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, 'progressMax', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor12 = _applyDecoratedDescriptor(_class.prototype, 'cached', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor13 = _applyDecoratedDescriptor(_class.prototype, 'tmpCached', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor14 = _applyDecoratedDescriptor(_class.prototype, 'selected', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor15 = _applyDecoratedDescriptor(_class.prototype, 'show', [observable], {
    enumerable: true,
    initializer: function () {
        return true;
    }
}), _descriptor16 = _applyDecoratedDescriptor(_class.prototype, 'shared', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'ext', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'ext'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'iconType', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'iconType'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'nameWithoutExtension', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'nameWithoutExtension'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'isImage', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isImage'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fsSafeUid', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fsSafeUid'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'tmpCachePath', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'tmpCachePath'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cachePath', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'cachePath'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'sizeFormatted', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'sizeFormatted'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'chunksCount', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'chunksCount'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'canShare', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'canShare'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'isOverInlineSizeLimit', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isOverInlineSizeLimit'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'isOversizeCutoff', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isOversizeCutoff'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeKegPayload', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeKegPayload'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeProps', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeProps'), _class.prototype)), _class);


uploadModule(File);
downloadModule(File);

module.exports = File;