const Keg = require('./kegs/keg');
const { observable, computed, action } = require('mobx');
const keys = require('../crypto/keys');
const cryptoUtil = require('../crypto/util');
const User = require('./user');
const fileHelper = require('../helpers/file');
const FileUploader = require('./file-uploader');
const FileDownloader = require('./file-downloader');
const FileNonceGenerator = require('./file-nonce-generator');
const util = require('../util');
const systemWarnings = require('./system-warning');
const config = require('../config');
const TinyDb = require('../db/tiny-db');

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
    // second progress bar, a bit ahead of 'progress', mostly for fun, somewhat close to reality
    @observable progressBuffer = 0;
    // mobile only: flag means file was downloaded and is available locally
    @observable cached = false;
    // is this file selected in file pickers
    @observable selected = false;
    // is this file visible or filtered by search
    @observable show = true;

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
            fileOwner: this.fileOwner,
            chunkSize: this.chunkSize
        };
    }

    @action deserializeProps(props) {
        this.fileId = props.fileId;
        this.readyForDownload = props.fileProcessingState === 'ready';
        this.size = +props.size;
        this.uploadedAt = new Date(+props.uploadedAt);
        this.fileOwner = props.fileOwner;
        this.chunkSize = +props.chunkSize;
    }

    // -- class methods ------------------------------------------------------------------------------------------
    // Open file with system's default file type handler app
    launchViewer(path) {
        return config.FileStream.launchViewer(path || this.cachePath);
    }

    // universal cleanup after failed or successful upload/download
    _resetUploadAndDownloadState(stream) {
        this.uploading = false;
        this.downloading = false;
        this.uploader && this.uploader.cancel();
        this.downloader && this.downloader.cancel();
        this.uploader = null;
        this.downloader = null;
        this.progress = 0;
        this.progressBuffer = 0;
        try {
            if (stream) stream.close();
        } catch (ex) {
            console.error(ex);
        }
    }

    _startUploader(stream, nonceGen) {
        this.uploader = new FileUploader(this, stream, nonceGen);
        return this.uploader.start();
    }

    upload(filePath, fileName) {
        if (this.downloading || this.uploading) {
            return Promise.reject(new Error(`File is already ${this.downloading ? 'downloading' : 'uploading'}`));
        }
        try {
            this._resetUploadAndDownloadState();
            this.uploading = true;

            this.uploadedAt = new Date(); // todo: should we update this when upload actually finishes?
            this.name = fileName || this.name || fileHelper.getFileName(filePath);
            this.key = cryptoUtil.bytesToB64(keys.generateEncryptionKey());
            this.fileId = cryptoUtil.getRandomUserSpecificIdB64(User.current.username);

            const stream = new config.FileStream(filePath, 'read');
            return stream.open()
                .then(() => {
                    console.log(`File read stream open. File size: ${stream.size}`);
                    this.size = stream.size;
                    this.chunkSize = config.upload.getChunkSize(this.size);
                    const nonceGen = new FileNonceGenerator(0, this.chunksCount - 1);
                    this.nonce = cryptoUtil.bytesToB64(nonceGen.nonce);
                    // now we have all the metadata for our keg, so we save it
                    return this.saveToServer().then(() => this._startUploader(stream, nonceGen));
                })
                .catch(err => {
                    console.error(err);
                    systemWarnings.add({
                        content: 'file_uploadFailed',
                        data: {
                            fileName: this.name
                        }
                    });
                    return Promise.reject(new Error(err));
                })
                .finally(() => this._resetUploadAndDownloadState(stream));
        } catch (ex) {
            this._resetUploadAndDownloadState();
            console.error(ex);
            return Promise.reject(ex);
        }
    }

    _startDownloader(stream, nonceGen, resumeParams) {
        this.downloader = new FileDownloader(this, stream, nonceGen, resumeParams);
        return this.downloader.start();
    }

    _getDlResumeParams(path) {
        return config.FileStream.getStat(path)
            .then(stat => {
                if (stat.size >= this.size) {
                    return Promise.resolve(false); // do not download
                }
                const wholeChunks = Math.floor(stat.size / this.chunkSize);
                const partialChunkSize = stat.size % this.chunkSize;
                return { wholeChunks, partialChunkSize };
            })
            .catch(err => {
                console.log(err);
                return Promise.resolve(true); // download from start
            });
    }

    /**
     * @param {string} [filePath] - file path (optional)
     * @param {boolean} resume
     */
    download(filePath, resume) {
        if (this.downloading || this.uploading) {
            return Promise.reject(new Error(`File is already ${this.downloading ? 'downloading' : 'uploading'}`));
        }
        try {
            this._resetUploadAndDownloadState();
            this.downloading = true;
            this.saveDownloadStartFact(filePath);
            const nonceGen = new FileNonceGenerator(0, this.chunksCount - 1, cryptoUtil.b64ToBytes(this.nonce));
            let stream, mode = 'write';
            let p = Promise.resolve(true);
            if (resume) {
                p = this._getDlResumeParams(filePath);
            }
            return p
                .then(resumeParams => {
                    if (resumeParams === false) return;
                    if (resumeParams !== true) {
                        mode = 'append';
                    } else resumeParams = null; // eslint-disable-line

                    stream = new config.FileStream(filePath, mode);
                    // eslint-disable-next-line consistent-return
                    return stream.open()
                        .then(() => this._startDownloader(stream, nonceGen, resumeParams));
                })
                .then(() => {
                    this.saveDownloadEndFact();
                    this.cached = true; // currently for mobile only
                })
                .finally(() => this._resetUploadAndDownloadState(stream));
        } catch (ex) {
            this._resetUploadAndDownloadState();
            console.error(ex);
            return Promise.reject(ex);
        }
    }

    cancelUpload() {
        this._resetUploadAndDownloadState();
    }

    cancelDownload() {
        this.saveDownloadEndFact();
        this._resetUploadAndDownloadState();
    }

    saveDownloadStartFact(path) {
        TinyDb.user.setValue(`DOWNLOAD:${this.fileId}`, {
            fileId: this.fileId,
            path
        });
    }
    saveDownloadEndFact() {
        TinyDb.user.removeValue(`DOWNLOAD:${this.fileId}`);
    }

    deleteCache() {
        config.FileSystem.delete(this.cachePath);
        this.cached = false;
    }
}


module.exports = File;
