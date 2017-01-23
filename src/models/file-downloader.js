const socket = require('../network/socket')();
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const cryptoUtil = require('../crypto/util');
const FileResumableAbstract = require('./file-resumable-abstract');

const CHUNK_OVERHEAD = 32; // not counting prepended 4 bytes denoting chunk size

class FileDownloader extends FileResumableAbstract {
    // if stop == true, download will stop as soon as possible
    stop = false;
    callbackCalled = false;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     * @param {function} callback
     */
    constructor(file, stream, nonceGenerator, callback) {
        super();
        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.file.progressMax = file.size;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this.callback = callback;
        this._getUrlParams = { fileId: file.fileId };
    }

    start() {
        console.log(`file-downloader.js: checking if partial file`);
        if (this.file.downloadPosition) {
            const { pos, chunkId, progress } = this.file.downloadPosition;
            if (pos && chunkId && progress) {
                this.pos = pos;
                this.nonceGenerator.chunkId = chunkId;
                this.file.progress = progress;
                console.log(`file-downloader.js: resuming ${this.pos}, ${this.nonceGenerator.chunkId}`);
            }
        }
        this._tick();
        console.log(`starting to download file id: ${this.file.id}`);
    }

    cancel() {
        this.stop = true;
        // TODO: delete partial file
        this.file.downloadPosition = null;
    }

    pos = 0;
    lastPos = 0;

    _tick = () => {
        if (this.stop) {
            this._callCallback('Download was cancelled.');
            return;
        }
        const errorStop = (err) => {
            console.log(`Download failed for ${this.file.fileId}`, err);
            this.cancel();
            this._callCallback(err);
        };
        this._checkTimeout();
        setTimeout(() => {
            try {
                this._getNextChunkSize()
                    .then(this._getChunk)
                    .then(this._decryptChunk)
                    .catch(err => {
                        // sometimes we get empty response after resume
                        // try to redo last chunk for this
                        console.error('file-downloader.js: error decrypting');
                        errorStop(err);
                        return Promise.reject(err);
                    })
                    .then(this._writeChunk)
                    .then(() => {
                        this.lastPos = this.pos;
                        const pos = this.pos;
                        const chunkId = this.nonceGenerator.chunkId;
                        const progress = this.file.progress;
                        this.file.downloadPosition = { pos, chunkId, progress };
                        if (this.file.progress === this.file.size) {
                            this._callCallback();
                            this.file.downloadPosition = 0;
                            return;
                        }
                        this._tick();
                    })
                    .catch(errorStop);
            } catch (err) {
                errorStop(err);
            }
        });
    };

    _getChunkUrl(from, to) {
        return socket.send('/auth/dev/file/url', this._getUrlParams)
            .then(f => `${f.url}?rangeStart=${from}&rangeEnd=${to}`);
    }

    _getNextChunkSize() {
        const start = this.pos;
        this.pos += 4;
        return this._getChunkUrl(start, this.pos - 1)
                    .then(this._downloadUrl)
                    .then(util.arrayBufferToNumber);
    }

    _getChunk = (size) => {
        this.file.progress += size - CHUNK_OVERHEAD;
        const start = this.pos;
        this.pos += size;
        return this._getChunkUrl(start, this.pos - 1)
                    .then(this._downloadUrl);
    };

    _decryptChunk = (chunk) => {
        const nonce = this.nonceGenerator.getNextNonce(this.file.progress === this.file.size);
        return secret.decrypt(new Uint8Array(chunk), this.fileKey,
                                nonce, false);
    };

    _writeChunk = (chunk) => {
        this.stream.write(chunk);
    };


    _abortChunkUpload = () => {
        if (this.xhr) {
            this.xhr.abort();
            this.xhr = null;
        }
    }

    _downloadUrl = (url) => {
        return new Promise((resolve /* , reject */) => {
            const self = this;

            const submit = () => {
                const xhr = new XMLHttpRequest();
                this.xhr = xhr;

                xhr.onreadystatechange = function() {
                    self._checkTimeout();
                    if (this.readyState !== 4) return;
                    self.xhr = null;
                    if (this.status === 200 || this.status === 206) {
                        self._checkTimeout(true);
                        resolve(this.response);
                        return;
                    }
                    console.error(`file-downloader.js: error downloading chunk`);
                };

                xhr.open('GET', url);
                xhr.responseType = 'arraybuffer';
                xhr.send();
                this._checkTimeout();
            };

            submit();
        });
    }

    /**
     * Wrapper around callback call makes it asynchronous and prevents more then 1 call
     * @param {[Error]} err - in case there was an error
     */
    _callCallback(err) {
        this._checkTimeout(true);
        if (this.callbackCalled) return;
        this.callbackCalled = true;
        setTimeout(() => this.callback(err));
    }

}

module.exports = FileDownloader;
