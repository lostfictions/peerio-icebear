//
// Upload module for File model, extracted for readability sake.
//

const config = require('../../config');
const warnings = require('./../warnings');
const FileUploader = require('./file-uploader');
const socket = require('../../network/socket');
const cryptoUtil = require('../../crypto/util');
const keys = require('../../crypto/keys');
const fileHelper = require('../../helpers/file');
const FileNonceGenerator = require('./file-nonce-generator');
const TinyDb = require('../../db/tiny-db');
const User = require('../user/user');
const { getFileStore } = require('../../helpers/di-file-store');

function _getUlResumeParams(path) {
    return config.FileStream.getStat(path)
        .then(stat => {
            if (stat.size !== this.size) {
                warnings.addSevere('error_fileSizeChanged', 'title_error', { fileName: this.name });
                throw new Error(`Upload file size mismatch. Was ${this.size} now ${stat.size}`);
            }
            // check file state on server
            return socket.send('/auth/file/state', { fileId: this.fileId });
        })
        .then(state => {
            console.log(state);
            if (state.status === 'ready' || state.chunksUploadComplete) {
                throw new Error('File already uploaded.');
            }
            return state.lastChunkNum + 1;
        })
        .catch(err => {
            console.log(err);
            this._saveUploadEndFact();
            this._resetUploadState();
            this.remove();
            return Promise.reject(); // do not upload
        });
}

/**
 * Starts file upload.
 * @param {string} filePath
 * @param {string} [fileName] - if you'd like to override this.name or filePath
 * @param {bool} [resume] - system sets this param to true when it detects unfinished upload
 * @returns {Promise}
 * @instance
 * @memberof File
 * @public
 */
function upload(filePath, fileName, resume) {
    if (this.downloading || this.uploading) {
        return Promise.reject(new Error(`File is already ${this.downloading ? 'downloading' : 'uploading'}`));
    }
    try {
        this.selected = false;
        this.progress = 0;
        this._resetUploadState();
        this.uploading = true;
        let p = Promise.resolve(null);
        if (resume) {
            p = this._getUlResumeParams(filePath);
        }
        // we need fileId to be set before function returns
        if (!this.fileId) {
            this.fileId = cryptoUtil.getRandomUserSpecificIdB64(User.current.username);
        }
        let stream, nextChunkId, nonceGen;
        return p.then(nextChunk => {
            nextChunkId = nextChunk;
            // no need to set values when it's a resume
            if (nextChunkId === null) {
                this.uploadedAt = new Date(); // todo: should we update this when upload actually finishes?
                this.name = fileName || this.name || fileHelper.getFileName(filePath);
                this.key = cryptoUtil.bytesToB64(keys.generateEncryptionKey());
            }
            stream = new config.FileStream(filePath, 'read');
            return stream.open();
        })
            .then(() => { // eslint-disable-line consistent-return
                console.log(`File read stream open. File size: ${stream.size}`);
                if (nextChunkId === null) {
                    this.size = stream.size;
                    if (!this.size) return Promise.reject(new Error('Can not upload zero size file.'));
                    this.chunkSize = config.upload.getChunkSize(this.size);
                    nonceGen = new FileNonceGenerator(0, this.chunksCount - 1);
                    this.nonce = cryptoUtil.bytesToB64(nonceGen.nonce);
                    return this.saveToServer().catch(err => {
                        console.error(err);
                        this.remove();
                        return Promise.reject(err);
                    });
                }
                nonceGen = new FileNonceGenerator(0, this.chunksCount - 1, cryptoUtil.b64ToBytes(this.nonce));
            })
            .then(() => {
                if (nextChunkId === null) this._saveUploadStartFact(filePath);
                this.uploader = new FileUploader(this, stream, nonceGen, nextChunkId);
                return this.uploader.start();
            })
            .then(() => {
                this._saveUploadEndFact();
                this._resetUploadState(stream);
                // 1 means there's only current task in queue
                if (getFileStore().uploadQueue.length === 1) warnings.add('snackbar_uploadComplete');
            })
            .catch(err => {
                console.error(err);
                console.log('file.upload.js: stopped uploading');
                if (err) {
                    if (err.name === 'UserCancelError') {
                        return Promise.reject(err);
                    }
                    if (err.name === 'DisconnectedError') {
                        this._resetUploadState();
                        return Promise.reject(err);
                    }
                }
                warnings.addSevere('error_uploadFailed', 'title_error', { fileName: this.name });
                this.cancelUpload();
                return Promise.reject(err || new Error('Upload failed'));
            });
    } catch (ex) {
        this._resetUploadState();
        console.error(ex);
        return Promise.reject(ex);
    }
}

/**
 * Cancels ongoing upload. This will also remove file keg.
 * @returns {Promise}
 * @instance
 * @memberof File
 * @public
 */
function cancelUpload() {
    if (this.readyForDownload) return Promise.reject();
    console.log('file.uploads.js: upload cancelled');
    this._saveUploadEndFact();
    this._resetUploadState();
    return this.remove();
}


function _saveUploadStartFact(path) {
    TinyDb.user.setValue(`UPLOAD:${this.fileId}`, {
        fileId: this.fileId,
        path
    });
}

function _saveUploadEndFact() {
    TinyDb.user.removeValue(`UPLOAD:${this.fileId}`);
}

function _resetUploadState(stream) {
    this.uploading = false;
    this.uploader && this.uploader.cancel();
    this.uploader = null;
    // this.progress = 0;
    try {
        if (stream) stream.close();
    } catch (ex) {
        console.error(ex);
    }
}

module.exports = function(File) {
    File.prototype._getUlResumeParams = _getUlResumeParams;
    File.prototype.upload = upload;
    File.prototype.cancelUpload = cancelUpload;
    File.prototype._saveUploadStartFact = _saveUploadStartFact;
    File.prototype._saveUploadEndFact = _saveUploadEndFact;
    File.prototype._resetUploadState = _resetUploadState;
};
