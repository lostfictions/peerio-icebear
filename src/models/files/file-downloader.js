const socket = require('../../network/socket');
const secret = require('../../crypto/secret');
const config = require('../../config');
const FileProcessor = require('./file-processor');

const CHUNK_OVERHEAD = config.CHUNK_OVERHEAD;

class FileDownloader extends FileProcessor {
    // chunks as they were uploaded
    decryptQueue = [];
    // flag to indicate that chunk is currently waiting for write promise resolve
    writing = false;
    // prevent parallel downloads
    downloading = false;
    // position of the blob as it is stored in the cloud
    downloadPos = 0;
    // blob was fully read
    downloadEof = false;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     * @param {{partialChunkSize, wholeChunks}} resumeParams
     */
    constructor(file, stream, nonceGenerator, resumeParams) {
        super(file, stream, nonceGenerator, 'download');
        // total amount to download and save to disk
        this.file.progressMax = file.sizeWithOverhead;
        this.getUrlParams = { fileId: file.fileId };
        this.chunkSizeWithOverhead = file.chunkSize + CHUNK_OVERHEAD;
        this.downloadChunkSize = Math.floor(config.download.maxDownloadChunkSize / this.chunkSizeWithOverhead)
            * this.chunkSizeWithOverhead;
        if (resumeParams) {
            this.partialChunkSize = resumeParams.partialChunkSize;
            nonceGenerator.chunkId = resumeParams.wholeChunks;
            this.file.progress = this.chunkSizeWithOverhead * resumeParams.wholeChunks;
            this.downloadPos = this.chunkSizeWithOverhead * resumeParams.wholeChunks;
        }
        socket.onDisconnect(this._abortXhr);
    }

    get _isDecryptQueueFull() {
        return (this.decryptQueue.length * (this.chunkSizeWithOverhead + 1))
            > config.download.maxDecryptBufferSize;
    }

    _abortXhr = () => {
        if (this.currentXhr) this.currentXhr.abort();
    };

    cleanup() {
        this._abortXhr();
        socket.unsubscribe(socket.SOCKET_EVENTS.disconnect, this._abortXhr);
    }

    // downloads config.download.chunkSize size chunk and stores it in parseQueue
    _downloadChunk() {
        if (this.stopped || this.downloading || this.downloadEof || this._isDecryptQueueFull) return;

        this.downloading = true;
        this._getChunkUrl(this.downloadPos, this.downloadPos + this.downloadChunkSize - 1)
            .then(this._download)
            .then(dlChunk => {
                if (dlChunk.byteLength === 0) {
                    this.downloadEof = true;
                    this.downloading = false;
                    this._tick();
                    return;
                }
                this.downloadPos += dlChunk.byteLength;
                for (let i = 0; i < dlChunk.byteLength; i += this.chunkSizeWithOverhead) {
                    const chunk = new Uint8Array(dlChunk, i,
                        Math.min(this.chunkSizeWithOverhead, dlChunk.byteLength - i));
                    this.decryptQueue.push(chunk);
                }
                if (this.downloadPos >= this.file.sizeWithOverhead) {
                    this.downloadEof = true;
                }
                this.downloading = false;
                this._tick();
            })
            .catch(this._error);
    }

    _decryptChunk() {
        if (this.stopped || this.writing || !this.decryptQueue.length) return;
        let chunk = this.decryptQueue.shift();
        const nonce = this.nonceGenerator.getNextNonce();
        chunk = secret.decrypt(chunk, this.fileKey, nonce, false);
        this.writing = true;
        if (this.partialChunkSize) {
            chunk = new Uint8Array(chunk, this.partialChunkSize, chunk.length - this.partialChunkSize);
            this.partialChunkSize = 0;
        }
        this.stream.write(chunk).then(this._onWriteEnd).catch(this._error);
    }

    _onWriteEnd = () => {
        this.writing = false;
        this._tick();
    };

    _checkIfFinished() {
        if (this.downloadEof && !this.decryptQueue.length && !this.writing) {
            this._finishProcess();
            return true;
        }
        return false;
    }
    _tick = () => {
        if (this.processFinished || this._checkIfFinished()) return;
        setTimeout(() => {
            try {
                this._downloadChunk();
                this._decryptChunk();
            } catch (err) {
                this._error(err);
            }
        });
    };

    _getChunkUrl(from, to) {
        return socket.send('/auth/file/url', this.getUrlParams)
            .then(f => `${f.url}?rangeStart=${from}&rangeEnd=${to}`);
    }

    // if enabling support for parallel XHR requests - convert this to array
    currentXhr = null;

    _download = (url) => {
        const self = this;
        let lastLoaded = 0;
        const p = new Promise((resolve, reject) => {
            const xhr = this.currentXhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState !== 4) return;
                if (this.status === 200 || this.status === 206) {
                    resolve(this.response);
                    return;
                }
                if (!p.isRejected()) reject();
            };

            xhr.onprogress = function(event) {
                self.file.progress += event.loaded - lastLoaded;
                lastLoaded = event.loaded;
            };

            xhr.ontimeout = xhr.onabort = xhr.onerror = function() {
                if (!p.isRejected()) reject();
            };

            xhr.open('GET', url);
            xhr.responseType = 'arraybuffer';
            xhr.send();
        }).finally(() => { this.currentXhr = null; });

        return p;
    };


}

module.exports = FileDownloader;
