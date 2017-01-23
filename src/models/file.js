const Keg = require('./kegs/keg');
const { observable, autorun, computed, reaction, when } = require('mobx');
const FileStreamAbstract = require('./file-stream');
const keys = require('../crypto/keys');
const cryptoUtil = require('../crypto/util');
const User = require('./user');
const fileHelper = require('../helpers/file');
const errors = require('../errors');
const FileUploader = require('./file-uploader');
const FileDownloader = require('./file-downloader');
const FileNonceGenerator = require('./file-nonce-generator');
const util = require('../util');
const systemWarnings = require('./system-warning');
const config = require('../config');

class File extends Keg {

    get FileStream() {
        return FileStreamAbstract.FileStream;
    }

    constructor(db) {
        super(null, 'file', db);
        autorun(() => {
            this.ext = fileHelper.getFileExtension(this.name);
        });
        if (config.isMobile) {
            when(() => this.fileId, () => {
                this.FileStream.loadPosition('upload', this.fileId)
                    .then(pos => {
                        if (pos && pos.path) {
                            return this.FileStream.exists(pos.path)
                                .then(exists => {
                                    if (!exists) {
                                        return Promise.reject(new Error(`file.js: ${pos.path} does not exist`));
                                    }
                                    // this._uploadPosition = pos;
                                    this._partialUploadPath = pos.path;
                                    this.isPartialUpload = true;
                                    return true;
                                });
                        }
                        return Promise.reject(new Error('file.js: upload path unspecified'));
                    })
                    .catch(() => {
                        this.uploadPosition = null;
                    });
            });
            reaction(() => this.downloaded || this.fileId, () => {
                if (!this.fileId) return;
                this.cacheExists = false;
                const path = this.cachePath;
                !!this.fileId && this.FileStream.exists(path)
                    .then(exists => {
                        this.cacheExists = exists;
                        exists && this.FileStream.loadPosition('download', path)
                            .then(pos => {
                                this.isPartialDownload = !!pos;
                                this._downloadPosition = pos || {};
                            });
                    });
            }, true);
        }
    }

    /**
     * Server needs some time to process file and upload it to cloud
     * before it can be downloaded. This property reflects the processing status.
     */
    @observable readyForDownload = false;
    @observable uploading = false;
    @observable downloading = false;
    @observable downloaded = false;
    @observable progress = 0;
    @observable progressMax = 0;
    @observable progressBuffer = 0;
    @observable name = '';
    @observable ext = '';
    @observable size = 0;
    @observable uploadedAt = null;
    @observable cacheExists = false;
    @observable selected = false;
    @observable fileId = null;
    @observable isPartialDownload = false;
    @observable isPartialUpload = false;
    @observable show = true;
    _downloadPosition = {};
    _uploadPosition = {};
    _partialUploadPath = null;

    get downloadPosition() {
        return this._downloadPosition;
    }

    set downloadPosition(val) {
        this._downloadPosition = val;
        config.isMobile && this.FileStream.savePosition('download', this.cachePath, val);
        if (!val) {
            this.isPartialDownload = false;
        }
    }

    get uploadPosition() {
        return this._uploadPosition;
    }

    set uploadPosition(val) {
        this._uploadPosition = val;
        config.isMobile && this.FileStream.savePosition('upload', this.fileId, val);
        if (!val) {
            this.isPartialUpload = false;
        }
    }

    @computed get cachePath() {
        if (config.isMobile) {
            const uid = cryptoUtil.getHexHash(16, cryptoUtil.b64ToBytes(this.fileId));
            return this.FileStream.cachePath(`${uid}.${this.ext}`);
        }
        return null;
    }

    @computed get sizeFormatted() {
        return util.formatBytes(this.size);
    }

    launchViewer() {
        return this.FileStream.launchViewer(this.cachePath);
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
            ext: this.ext, // not really needed, since it's computed, but we want to be able to search for it
            uploadedAt: this.uploadedAt.valueOf(),
            fileOwner: this.fileOwner
        };
    }

    deserializeProps(props) {
        this.fileId = props.fileId;
        this.readyForDownload = props.fileProcessingState === 'ready';
        this.size = +props.size;
        this.ext = props.ext;
        this.uploadedAt = new Date(+props.uploadedAt);
        this.fileOwner = props.fileOwner;
    }


    upload(filePathParam, fileName) {
        let filePath = null;
        filePath = filePathParam || this._partialUploadPath;
        if (!filePath) {
            console.error('file.js: no cached path available');
            throw new Error('file.js: no cached path available');
        }
        if (!filePath && !this.nonce) {
            console.error('file.js: trying to resume upload with missing nonce');
            throw new Error('file.js: trying to resume upload with missing nonce');
        }
        // prevent invalid use
        if (this.uploading || this.downloading) return Promise.reject();
        this.owner = User.current.username; // todo: probably remove this after files get proper updates
        this.uploading = true;
        this.progress = 0;
        this.progressBuffer = 0;
        // preparing stream
        const stream = new this.FileStream(filePath, 'read', config.chunkSize);
        // if we are recovering upload, restore nonce
        const nonceGen = new FileNonceGenerator();
        this.nonce = cryptoUtil.bytesToB64(nonceGen.nonce);
        this.uploadedAt = new Date();
        this.name = fileName || this.name || fileHelper.getFileName(filePath);
        this.key = cryptoUtil.bytesToB64(keys.generateEncryptionKey());
        this.fileId = cryptoUtil.getRandomFileId(User.current.username);

        return stream.open()
            .then(size => {
                console.log(`File read stream open. File size: ${size}`);
                this.size = size;
                return this.saveToServer();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    const maxChunkId = Math.ceil(this.size / config.chunkSize) - 1;
                    this.uploader = new FileUploader(this, stream, nonceGen, maxChunkId, filePath, err => {
                        err ? reject(errors.normalize(err)) : resolve();
                    });
                    this.uploader.start();
                });
            })
            .catch(err => {
                console.error(err);
                systemWarnings.add({
                    content: 'file_uploadFailed',
                    data: {
                        fileName: this.name
                    }
                });
                return Promise.reject(new Error('upload failed'));
            })
            .finally(() => {
                this.uploading = false;
                this.progress = 0;
                this.progressBuffer = 0;
                this.uploader = null;
                stream && stream.close();
            });
    }

    cancelUpload() {
        if (this.uploader) this.uploader.cancel();
    }

    /**
     * @param {string} [filePath] - file path (optional)
     */
    download(filePath) {
        if (this.downloading || this.uploading) return Promise.reject(new Error('File is already downloading'));
        const path = filePath || this.cachePath;
        if (!path) return Promise.reject(new Error('No path or cache path provided'));
        this.downloading = true;
        this.progress = 0;
        this.progressBuffer = 0;
        const nonceGen = new FileNonceGenerator(cryptoUtil.b64ToBytes(this.nonce));
        const stream = new this.FileStream(path, this.isPartialDownload ? 'append' : 'write');
        return stream.open()
            .then(() => {
                console.log(`File write stream open.`);
                return new Promise((resolve, reject) => {
                    this.downloader = new FileDownloader(this, stream, nonceGen, err => {
                        err ? reject(errors.normalize(err)) : resolve();
                    });
                    this.downloader.start();
                });
            }).finally(() => {
                this.downloading = false;
                this.progress = 0;
                this.progressBuffer = 0;
                this.downloader = null;
                stream && stream.close().then(() => (this.downloaded = true));
            });
    }

    cancelDownload() {
        if (this.downloader) this.downloader.cancel();
    }
}


module.exports = File;
