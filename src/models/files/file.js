const Keg = require('./../kegs/keg');
const { observable, computed, action } = require('mobx');
const { cryptoUtil, secret } = require('../../crypto');
const fileHelper = require('../../helpers/file');
const util = require('../../util');
const config = require('../../config');
const socket = require('../../network/socket');
const uploadModule = require('./file.upload');
const downloadModule = require('./file.download');
const { getUser } = require('../../helpers/di-current-user');
const { retryUntilSuccess } = require('../../helpers/retry');

// todo: this is duplication
const CHUNK_OVERHEAD = 32;

class File extends Keg {

    constructor(db) {
        super(null, 'file', db);
    }

    // -- Model data ---------------------------------------------------------------------------------------------
    @observable fileId = null;
    @observable name = '';
    @observable size = 0;
    @observable uploadedAt = null;

    // -- View state data ----------------------------------------------------------------------------------------
    // Depends on server set property 'fileProcessingState'
    @observable readyForDownload = false;
    @observable uploading = false;
    @observable downloading = false;
    // upload or download progress value
    @observable progress = 0;
    @observable progressMax = 0;
    // mobile only: flag means file was downloaded and is available locally
    @observable cached = false;
    // is this file selected in file pickers
    @observable selected = false;
    // is this file visible or filtered by search
    @observable show = true;
    // is upload cancel is initiated by user
    uploadCancelled = false;

    // -- computed properties ------------------------------------------------------------------------------------
    // file extension
    @computed get ext() {
        return fileHelper.getFileExtension(this.name);
    }
    // Full path to locally stored file
    @computed get cachePath() {
        if (!config.isMobile) return null;
        // we need constant id to find file in cache, but fileId contains some restricted characters
        const uid = cryptoUtil.getHexHash(16, cryptoUtil.b64ToBytes(this.fileId));
        return config.FileStream.getFullPath(`${uid}.${this.ext}`);
    }
    // Human readable file siz
    @computed get sizeFormatted() {
        return util.formatBytes(this.size);
    }

    @computed get chunksCount() {
        return Math.ceil(this.size / this.chunkSize);
    }

    get sizeWithOverhead() {
        return this.size + this.chunksCount * CHUNK_OVERHEAD;
    }

    // -- keg serializators --------------------------------------------------------------------------------------
    serializeKegPayload() {
        return {
            name: this.name,
            key: this.key,
            nonce: this.nonce
        };
    }

    @action deserializeKegPayload(data) {
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
            fileOwner: this.fileOwner || this.sharedBy,
            chunkSize: this.chunkSize
        };
    }

    @action deserializeProps(props) {
        this.fileId = props.fileId;
        this.readyForDownload = props.fileProcessingState === 'ready' || !!props.sharedBy;
        this.size = +props.size;
        this.uploadedAt = new Date(+props.uploadedAt);
        this.fileOwner = props.fileOwner;
        this.chunkSize = +props.chunkSize;
    }

    // -- class methods ------------------------------------------------------------------------------------------
    share(contact) {
        const data = {
            recipient: contact.username,
            originalKegId: this.id,
            keg: {
                type: this.type
            }
        };
        // todo: this is questionable, could we leak properties we don't want to this way?
        // todo: on the other hand we can forget to add properties that we do want to share
        data.keg.props = this.serializeProps();
        data.keg.payload = this.serializeKegPayload();
        data.keg.payload = JSON.stringify(data.keg.payload);
        data.keg.payload = secret.encryptString(
            data.keg.payload, getUser().getSharedKey(contact.encryptionPublicKey)
        );
        data.keg.payload = data.keg.payload.buffer;
        // when we implement key change history, this will help to figure out which key to use
        // this properties should not be blindly trusted, recipient verifies them
        data.keg.props.sharedKegSenderPK = cryptoUtil.bytesToB64(getUser().encryptionKeys.publicKey);
        // reserved for future key change feature support
        data.keg.props.sharedKegRecipientPK = cryptoUtil.bytesToB64(contact.encryptionPublicKey);

        return retryUntilSuccess(() => socket.send('/auth/kegs/share', data));
    }

    // Open file with system's default file type handler app
    launchViewer(path) {
        return config.FileStream.launchViewer(path || this.cachePath);
    }

    deleteCache() {
        config.FileSystem.delete(this.cachePath);
        this.cached = false;
    }

    remove() {
        this._resetUploadState();
        this._resetDownloadState();
        if (!this.id) return Promise.resolve();
        return retryUntilSuccess(() => super.remove(), `remove file ${this.id}`).then(() => { this.deleted = true; });
    }
}

uploadModule(File);
downloadModule(File);

module.exports = File;
