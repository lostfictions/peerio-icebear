/**
 * Skynet's little brother who tries hard to remove bottlenecks in the whole
 * "read -> encrypt -> upload" process to maximize upload speed.
 */
const socket = require('../network/socket');
const errors = require('../errors');
const secret = require('../crypto/secret');
const cryptoUtil = require('../crypto/util');
const config = require('../config');

class FileUploader {
    // read chunks go here
    encryptQueue = [];
    // encrypted chunks go here
    uploadQueue = [];
    // next queue processing calls will stop if stop == true
    stop = false;
    // end of file reached while reading file
    eofReached = false;
    // upload stopped and promise resolved/rejected
    uploadFinished = false;

    lastReadChunkId = -1;
    // amount of chunks that currently wait for response from server
    chunksWaitingForResponse = 0;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     */
    constructor(file, stream, nonceGenerator) {
        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.file.progressMax = stream.size;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
    }

    start() {
        console.log(`starting uploader for file id: ${this.file.id}`);
        this._tick();
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    cancel() {
        this.stop = true;
    }

    // stops upload and resolves or rejects upload promise
    _finishUpload(err) {
        if (this.uploadFinished) return;
        this.uploadFinished = true;
        this.stop = true; // bcs in case of error some calls might be scheduled
        if (err) {
            console.log(`Failed to upload file ${this.file.fileId}. Upload filed.`, err);
            this.reject(errors.normalize(err));
            return;
        }
        console.log(`Successfully done uploading file: ${this.file.fileId}`, this.toString());
        this.resolve();
    }

    // shortcut to finish upload with error
    _error = err => {
        this._finishUpload(err || new Error('Upload failed.'));
    };

    // reads chunk from fs and puts it in encryption queue
    _readChunk() {
        if (this.stop || this.eofReached || this.encryptQueue.length >= config.upload.maxEncryptQueue) return;
        this.stream.read(config.upload.chunkSize)
            .then(this._processReadChunk)
            .catch(this._error);
    }

    _processReadChunk = buffer => {
        if (buffer.length === 0) {
            this.eofReached = true;
        } else {
            this.encryptQueue.push({ id: ++this.lastReadChunkId, buffer });
        }
        this._tick();
    };

    _encryptChunk = () => {
        if (this.stop || this.uploadQueue.length >= config.upload.maxUploadQueue
            || !this.encryptQueue.length) return;
        try {
            const chunk = this.encryptQueue.shift();
            chunk.buffer = secret.encrypt(chunk.buffer, this.fileKey,
                            this.nonceGenerator.getNextNonce(this.eofReached && this.encryptQueue.length === 0),
                            false, true);
            this.uploadQueue.push(chunk);
            this.file.progressBuffer = this.stream.pos;
            this._tick();
        } catch (err) {
            this._error(err);
        }
    };

    _uploadChunk() {
        if (this.stop || !this.uploadQueue.length
            || this.chunksWaitingForResponse >= config.upload.maxResponseQueue) return;

        const chunk = this.uploadQueue.shift();
        this.chunksWaitingForResponse++;

        socket.send('/auth/dev/file/upload-chunk', {
            fileId: this.file.fileId,
            chunkNum: chunk.id,
            chunk: chunk.buffer.buffer,
            last: this.eofReached && this.uploadQueue.length === 0 && this.encryptQueue.length === 0
        })
            .then(() => {
                this.chunksWaitingForResponse--;
                this.file.progress =
                    this.file.progressBuffer - (this.uploadQueue.length * config.upload.chunkSize);
                this._tick();
            })
            .catch(this._error);

        this._tick();
    }

    _checkIfFinished() {
        if (this.eofReached && !this.encryptQueue.length
            && !this.uploadQueue.length && !this.chunksWaitingForResponse) {
            this._finishUpload();
            return true;
        }
        return false;
    }

    // for logging and debugging
    toString() {
        return JSON.stringify({
            // fileId: this.file.fileId,
            dataChunksLength: this.encryptQueue.length,
            cipherChunksLength: this.uploadQueue.length,
            // stop: this.stop,
            // eofReached: this.eofReached,
            lastReadChunkId: this.lastReadChunkId
        });
    }

    _tick = () => {
        if (this.uploadFinished || this._checkIfFinished()) return;
        setTimeout(() => {
            try {
               // console.log(this.toString());
                this._readChunk();
                setTimeout(this._encryptChunk);
                this._uploadChunk();
            } catch (err) {
                console.log(`Upload failed for ${this.file.fileId}`, err, this.toString());
                this._finishUpload(errors.normalize(err));
            }
        });
    }

}


module.exports = FileUploader;
