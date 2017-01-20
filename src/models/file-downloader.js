const socket = require('../network/socket');
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const config = require('../config');
const FileProcessor = require('./file-processor');

const CHUNK_OVERHEAD = 32;

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
     */
    constructor(file, stream, nonceGenerator) {
        super(file, stream, nonceGenerator, 'download');
        this.file.progressMax = file.size + file.chunksCount * CHUNK_OVERHEAD;
        this.getUrlParams = { fileId: file.fileId };
        this.chunkSizeWithOverhead = file.chunkSize + CHUNK_OVERHEAD;
        this.downloadChunkSize = Math.floor(config.download.maxDownloadChunkSize / this.chunkSizeWithOverhead)
                                    * this.chunkSizeWithOverhead;
    }

    get _isDecryptQueueFull() {
        return (this.decryptQueue.length * (this.chunkSizeWithOverhead + 1))
                    > config.download.maxDecryptBufferSize;
    }

    // downloads config.download.chunkSize size chunk and stores it in parseQueue
    _downloadChunk() {
        if (this.stop || this.downloading || this.downloadEof || this._isDecryptQueueFull) return;

        this.downloading = true;
        this._getChunkUrl(this.downloadPos, this.downloadPos + this.downloadChunkSize-1)
            .then(this._download)
            .then(dlChunk => {
                console.log(`Downloaded ${dlChunk.byteLength} bytes`);
                if (dlChunk.byteLength === 0) {
                    this.downloadEof = true;
                    this._tick();
                    return;
                }
                this.downloadPos += dlChunk.byteLength;
                for (let i = 0; i < dlChunk.byteLength; i += this.chunkSizeWithOverhead) {
                    const chunk = new Uint8Array(dlChunk, i,
                        Math.min(this.chunkSizeWithOverhead, dlChunk.byteLength - i));
                    this.decryptQueue.push(chunk);
                }
                this.downloading = false;
                this._tick();
            })
            .catch(this._error);
    }

    _decryptChunk() {
        if (this.stop || this.writing || !this.decryptQueue.length) return;
        let chunk = this.decryptQueue.shift();
        this.file.progress += chunk.length;
        const nonce = this.nonceGenerator.getNextNonce();
        chunk = secret.decrypt(chunk, this.fileKey, nonce, false);
        this.writing = true;
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
        return socket.send('/auth/dev/file/url', this.getUrlParams)
            .then(f => `${f.url}?rangeStart=${from}&rangeEnd=${to}`);
    }


    _download = (url) => {
        const self = this;
        const startProgress = this.file.progressBuffer;
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

            xhr.onprogress = function(event) {
                self.file.progressBuffer = startProgress + event.loaded;
            };

            xhr.open('GET', url);
            xhr.responseType = 'arraybuffer';
            xhr.send();
        });
    };


}

module.exports = FileDownloader;
