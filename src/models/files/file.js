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

const CHUNK_OVERHEAD = config.CHUNK_OVERHEAD;

class File extends Keg {

    constructor(db) {
        super(null, 'file', db);
    }

    // -- Model data ---------------------------------------------------------------------------------------------
    @observable fileId = null;
    @observable name = '';
    @observable size = 0;
    @observable uploadedAt = null;

    @observable fileOwner;

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
    uploadCancelled = false; // todo: anri: i don't like this
    // is this file currently shared with anyone
    @observable shared = false;

    // -- computed properties ------------------------------------------------------------------------------------
    // file extension
    @computed get ext() {
        return fileHelper.getFileExtension(this.name);
    }
    // Full path to locally stored file
    @computed get cachePath() {
        if (!config.isMobile) return null;
        // we need constant id to find file in cache, but fileId contains some restricted characters
        const uid = this.name || cryptoUtil.getHexHash(16, cryptoUtil.b64ToBytes(this.fileId));
        return config.FileStream.getFullPath(`${uid}.${this.ext}`);
    }
    // Human readable file siz
    @computed get sizeFormatted() {
        return util.formatBytes(this.size);
    }

    @computed get chunksCount() {
        return Math.ceil(this.size / this.chunkSize);
    }

    @computed get canShare() {
        return getUser().username === this.fileOwner;
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
            chunkSize: this.chunkSize
        };
    }

    @action deserializeProps(props) {
        this.fileId = props.fileId;
        this.readyForDownload = props.fileProcessingState === 'ready' || !!props.sharedBy;
        this.size = +props.size;
        this.uploadedAt = new Date(+props.uploadedAt);
        this.fileOwner = props.owner || this.owner;
        this.sharedBy = props.sharedBy;
        this.chunkSize = +props.chunkSize;
        this.shared = props.shared;
    }

    // -- class methods ------------------------------------------------------------------------------------------
    share(contactOrContacts) {
        const contacts =
            (Array.isArray(contactOrContacts) || isObservableArray(contactOrContacts))
                ? contactOrContacts
                : [contactOrContacts];

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
                encryptedPayloadKey: cryptoUtil.bytesToB64(
                    secret.encrypt(
                        payloadKey, getUser().getSharedKey(contact.encryptionPublicKey)
                    )
                )
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
