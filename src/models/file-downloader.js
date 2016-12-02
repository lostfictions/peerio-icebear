const socket = require('../network/socket');
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const cryptoUtil = require('../crypto/util');

const CHUNK_OVERHEAD = 32; // not counting prepended 4 bytes denoting chunk size

class FileDownloader {
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
        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.file.progressMax = file.size;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this.callback = callback;
        this._getUrlParams = { fileId: file.fileId };
    }

    start() {
        this._tick();
        console.log(`starting to download file id: ${this.file.id}`);
    }

    cancel() {
        this.stop = true;
    }
    /*
    socket.send('/auth/dev/file/url',
    ).then(f=>{console.log(f.url); fetch(f.url+'?rangeStart=40&rangeEnd=5000').then(r=>console.log(r.blob()));})
    */
    pos = 0;
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
                    .then(chunk => this.stream.write(chunk, CHUNK_OVERHEAD))
                    .then(() => {
                        if (this.file.progress === this.file.size) {
                            this._callCallback();
                            return;
                        }
                        this._tick();
                    });
            } catch (err) {
                console.log(`Download failed for ${this.file.fileId}`, err);
                this.stop = true;
                this._callCallback(err);
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
        return secret.decrypt(new Uint8Array(chunk), this.fileKey,
                                this.nonceGenerator.getNextNonce(this.file.progress === this.file.size), false);
    };

    _downloadUrl(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (this.readyState !== 4) return;
                if (this.status === 200 || this.status === 206) {
                    resolve(this.response);
                    return;
                }
                reject(this);
            };

            xhr.open('GET', url);
            xhr.responseType = 'arraybuffer';
            xhr.send();
        });
    }

    /**
     * Wrapper around callback call makes it asynchronous and prevents more then 1 call
     * @param {[Error]} err - in case there was an error
     */
    _callCallback(err) {
        if (this.callbackCalled) return;
        this.callbackCalled = true;
        setTimeout(() => this.callback(err));
    }

}

module.exports = FileDownloader;
