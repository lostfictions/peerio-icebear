const socket = require('../network/socket');
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const cryptoUtil = require('../crypto/util');

const CHUNK_OVERHEAD = 32; // not counting prepended 4 bytes denoting chunk size

class FileDownloader {
    // if stop == true, download will stop as soon as possible
    stop = false;
    callbackCalled = false;
    pos = 0;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     */
    constructor(file, stream, nonceGenerator) {
        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.file.progressMax = file.size;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this._getUrlParams = { fileId: file.fileId };
    }

    start() {
        this._tick();
        console.log(`starting to download file id: ${this.file.id}`);
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    cancel() {
        this.stop = true;
    }

    _tick = () => {
        if (this.stop) {
            this._callCallback('Download was cancelled.');
            return;
        }
        setTimeout(() => {
            try {
                this._getNextChunkSize()
                    .then(this._getChunk)
                    .then(this._decryptChunk)
                    .then(this._writeChunk)
                    .then(() => {
                        if (this.file.progress === this.file.size) {
                            this._callCallback();
                        } else {
                            this._tick();
                        }
                    })
                    .catch(this._processChunkError);
            } catch (err) {
                this._processChunkError(err);
            }
        });
    };

    _processChunkError(err) {
        console.log(`Download failed for ${this.file.fileId}`, err);
        this._callCallback(err);
    }

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

    _downloadUrl = (url) => {
        return new Promise((resolve) => {
            const self = this;

            const submit = () => {
                const xhr = new XMLHttpRequest();
                this.xhr = xhr;

                xhr.onreadystatechange = function() {
                    if (this.readyState !== 4) return;
                    self.xhr = null;
                    if (this.status === 200 || this.status === 206) {
                        resolve(this.response);
                        return;
                    }
                    console.error(`file-downloader.js: error downloading chunk`);
                };

                xhr.open('GET', url);
                xhr.responseType = 'arraybuffer';
                xhr.send();
            };

            submit();
        });
    };

    /**
     * Wrapper around callback call makes it asynchronous and prevents more then 1 call
     * @param {[Error]} err - in case there was an error
     */
    _callCallback(err) {
        if (this.callbackCalled) return;
        this.callbackCalled = true;
        this.cancel();
        setTimeout(() => { err ? this.reject(err) : this.resolve(); });
    }

}

module.exports = FileDownloader;
