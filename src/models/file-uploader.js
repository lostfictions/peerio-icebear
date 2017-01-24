/**
 * Skynet's little brother who tries hard to remove bottlenecks in the whole
 * "read -> encrypt -> upload" process to maximize upload speed.
 */
const socket = require('../network/socket')();
const errors = require('../errors');
const secret = require('../crypto/secret');
const config = require('../config');
const FileProcessor = require('./file-processor');

class FileUploader extends FileProcessor {
    // read chunks go here
    encryptQueue = [];
    // encrypted chunks go here
    uploadQueue = [];
    // end of file reached while reading file
    eofReached = false;

    readingChunk = false;
    lastReadChunkId = -1;
    // amount of chunks that currently wait for response from server
    chunksWaitingForResponse = 0;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     */
    constructor(file, stream, nonceGenerator) {
        super(file, stream, nonceGenerator, 'upload');
        this.file.progressMax = stream.size;
    }

    get _isEncryptQueueFull() {
        return (this.encryptQueue.length + 1) * this.file.chunkSize > config.upload.encryptBufferSize;
    }

    get _isUploadQueueFull() {
        // chunk overhead neglecting is ok, too small
        return (this.uploadQueue.length + 1) * this.file.chunkSize > config.upload.uploadBufferSize;
    }

    // reads chunk from fs and puts it in encryption queue
    _readChunk() {
        if (this.readingChunk || this.stopped || this.eofReached || this._isEncryptQueueFull) return;
        this.readingChunk = true;
        this.stream.read(this.file.chunkSize)
            .then(this._processReadChunk)
            .catch(this._error);
    }

    _processReadChunk = buffer => {
        this.readingChunk = false;
        if (this.stopped) return;
        if (buffer.length === 0) {
            this.eofReached = true;
        } else {
            this.encryptQueue.push({ id: ++this.lastReadChunkId, buffer });
        }
        this._tick();
    };

    _encryptChunk = () => {
        if (this.stopped || this._isUploadQueueFull || !this.encryptQueue.length) return;
        try {
            const chunk = this.encryptQueue.shift();
            const isLast = this.eofReached && this.encryptQueue.length === 0;
            const nonce = this.nonceGenerator.getNextNonce(isLast);
            chunk.buffer = secret.encrypt(chunk.buffer, this.fileKey, nonce, false, false);
            this.uploadQueue.push(chunk);
            this.file.progressBuffer = this.stream.pos;
            this._tick();
        } catch (err) {
            this._error(err);
        }
    };

    _uploadChunk() {
        if (this.stopped || !this.uploadQueue.length
            || this.chunksWaitingForResponse >= config.upload.maxResponseQueue) return;

        const chunk = this.uploadQueue.shift();
        this.chunksWaitingForResponse++;

        socket.send('/auth/dev/file/upload-chunk', {
            fileId: this.file.fileId,
            chunkNum: chunk.id,
            chunk: chunk.buffer.buffer,
            last: this.eofReached && !this.uploadQueue.length && !this.encryptQueue.length
        })
            .then(() => {
                this.chunksWaitingForResponse--;
                if (this.stopped) return;
                this.file.progress =
                    this.file.progressBuffer - (this.uploadQueue.length * this.file.chunkSize);
                this._tick();
            })
            .catch(this._error);

        this._tick();
    }

    _checkIfFinished() {
        if (this.eofReached && !this.encryptQueue.length
            && !this.uploadQueue.length && !this.chunksWaitingForResponse) {
            this._finishProcess();
            return true;
        }
        return false;
    }

    // for logging and debugging
    toString() {
        return JSON.stringify({
            // fileId: this.file.fileId,
            encryptQueue: this.encryptQueue.length,
            uploadQueue: this.uploadQueue.length,
            stopped: this.stopped,
            eofReached: this.eofReached,
            finished: this.processFinished,
            lastReadChunkId: this.lastReadChunkId
        });
    }

    _tick = () => {
        if (this.processFinished || this._checkIfFinished()) return;
        setTimeout(() => {
            try {
                this._readChunk();
                setTimeout(this._encryptChunk);
                this._uploadChunk();
            } catch (err) {
                this._finishProcess(errors.normalize(err));
            }
        });
    }

}


module.exports = FileUploader;
