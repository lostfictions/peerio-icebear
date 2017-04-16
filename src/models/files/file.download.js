/**
 * Download module for File model, for code file length sake
 */
const config = require('../../config');
const warnings = require('./../warnings/warnings');
const FileDownloader = require('./file-downloader');
const cryptoUtil = require('../../crypto/util');
const FileNonceGenerator = require('./file-nonce-generator');
const TinyDb = require('../../db/tiny-db');

function _getDlResumeParams(path) {
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
function download(filePath, resume) {
    if (this.downloading || this.uploading) {
        return Promise.reject(new Error(`File is already ${this.downloading ? 'downloading' : 'uploading'}`));
    }
    try {
        this.progress = 0;
        this._resetDownloadState();
        this.downloading = true;
        this._saveDownloadStartFact(filePath);
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
                    .then(() => {
                        this.downloader = new FileDownloader(this, stream, nonceGen, resumeParams);
                        return this.downloader.start();
                    });
            })
            .then(() => {
                this._saveDownloadEndFact();
                this._resetDownloadState(stream);
                this.cached = true; // currently for mobile only
            })
            .catch(err => {
                console.error(err);
                warnings.addSevere('error_downloadFailed', 'error', { fileName: this.name });
                this._resetDownloadState();
            });
    } catch (ex) {
        this._resetDownloadState();
        console.error(ex);
        return Promise.reject(ex);
    }
}

function cancelDownload() {
    this._saveDownloadEndFact();
    this._resetDownloadState();
}

function _saveDownloadStartFact(path) {
    TinyDb.user.setValue(`DOWNLOAD:${this.fileId}`, {
        fileId: this.fileId,
        path
    });
}
function _saveDownloadEndFact() {
    TinyDb.user.removeValue(`DOWNLOAD:${this.fileId}`);
}

function _resetDownloadState(stream) {
    this.uploading = false;
    this.downloading = false;
    this.uploader && this.uploader.cancel();
    this.downloader && this.downloader.cancel();
    this.uploader = null;
    this.downloader = null;
    // this.progress = 0;
    try {
        if (stream) stream.close();
    } catch (ex) {
        console.error(ex);
    }
}

module.exports = function(File) {
    File.prototype._getDlResumeParams = _getDlResumeParams;
    File.prototype.download = download;
    File.prototype.cancelDownload = cancelDownload;
    File.prototype._saveDownloadStartFact = _saveDownloadStartFact;
    File.prototype._saveDownloadEndFact = _saveDownloadEndFact;
    File.prototype._resetDownloadState = _resetDownloadState;
};
