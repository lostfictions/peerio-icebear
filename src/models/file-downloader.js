const socket = require('../network/socket');
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const config = require('../config');
const FileProcessor = require('./file-processor');
const ArrayStream = require('../helpers/array-stream');

const CHUNK_OVERHEAD = 32; // not counting prepended 4 bytes denoting chunk size


class FileDownloader extends FileProcessor {
    // an array of raw blob chunks as downloaded, this != actual chunks that we are going to decrypt
    parseQueue = [];
    parseQueueDirty = false;
    // actual chunks as they were downloaded
    decryptQueue = [];
    // flag to indicate that chunk is currently waiting for write promise resolve
    writing = false;
    // prevent parallel downloads
    downloading = false;
    // position of the blob as it is stored in the cloud
    downloadPos = 0;
    // blob was fully read
    downloadEof = false;
    // a position in the first chunk in the queue at which to start parsing chunks
    // this is needed bcs download chunks != decrypt chunks
    parsePos = 0;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     */
    constructor(file, stream, nonceGenerator) {
        super(file, stream, nonceGenerator, 'download');
        // this is not exactly accurate because there's an overhead in each chunk
        // but the amount is so small (<200kb for 1gb file) we can ignore it
        this.file.progressMax = file.size;
        this.getUrlParams = { fileId: file.fileId };
        this.parseQueueStream = new ArrayStream(this.parseQueue);
    }


    // downloads config.download.chunkSize size chunk and stores it in parseQueue
    _downloadChunk() {
        if (this.stop || this.downloading || this.downloadEof
            || this.parseQueue.length >= config.download.maxParseQueue) return;

        this.downloading = true;
        this._getChunkUrl(this.downloadPos, this.downloadPos + config.download.chunkSize)
            .then(this._download)
            .then(chunk => {
                console.log(`Downloaded ${chunk.byteLength} bytes`);
                if (chunk.byteLength === 0) {
                    this.downloadEof = true;
                    this._tick();
                    return;
                }
                this.downloadPos += chunk.byteLength;
                this.file.progressBuffer = this.downloadPos;
                this.parseQueue.push(new Uint8Array(chunk));
                this.downloading = false;
                this.parseQueueDirty = true;
                this._tick();
            })
            .catch(this._error);
    }

    // analyzes current parse queue, extracts chunk for decrypt
    _parseChunk() {
        if (this.stop || !this.parseQueueDirty
            || this.decryptQueue.length >= config.download.maxDecryptQueue) return;

        let size;
        if (this.waitingForChunkSize) {
            size = this.waitingForChunkSize;
        } else {
            size = this.parseQueueStream.read(4);
            if (!size) {
                // not interested in chunk parsing until parse queue updates
                this.parseQueueDirty = false;
                // here we call _tick() because we actually consumed 4 bytes,
                this._tick();
                return;
            }
            size = util.byteArrayToNumber(size);
        }
        const chunk = this.parseQueueStream.read(size);
        if (!chunk) {
            console.log('parser waits for '+ size+ ' bytes');
            this.waitingForChunkSize = size;
            // not interested in chunk parsing until parse queue updates
            this.parseQueueDirty = false;
            // here we don't call _tick() bcs nothing was changed
            return;
        }
        this.waitingForChunkSize = null;
        this.decryptQueue.push(chunk);
        this._tick();
    }


    _decryptChunk() {
        if (this.stop || this.writing || !this.decryptQueue.length) return;
        let chunk = this.decryptQueue.shift();
        this.file.progress += chunk.length - CHUNK_OVERHEAD;
        const nonce = this.nonceGenerator.getNextNonce(this.file.progress === this.file.size);
        chunk = secret.decrypt(chunk, this.fileKey, nonce, false);
        this.writing = true;
        this.stream.write(chunk).then(this._onWriteEnd).catch(this._error);
    }

    _onWriteEnd = () => {
        this.writing = false;
        this._tick();
    };

    _checkIfFinished() {
        if (this.downloadEof && !this.decryptQueue.length
            && !this.parseQueue.length && !this.writing) {
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
                this._parseChunk();
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
