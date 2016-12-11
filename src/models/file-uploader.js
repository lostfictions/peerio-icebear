/**
 * Skynet's little brother who tries hard to remove bottlenecks in the whole
 * "read -> encrypt -> upload" process to maximize upload speed.
 */

const socket = require('../network/socket');
const errors = require('../errors');
const secret = require('../crypto/secret');
const cryptoUtil = require('../crypto/util');

class FileUploader {
    // read chunks go here
    dataChunks = [];
    // encrypted chunks go here
    cipherChunks = [];

    // max data chunks in read queue
    dataChunksLimit = 1;// DO NOT CHANGE THIS. File reader reuses same buffer.
    // max data chunks in encrypt queue
    cipherChunksLimit = 3;

    // currently reading a chunk from file
    reading = false;
    // currently encrypting a chunk
    encrypting = false;
    // currently uploading a chunk
    uploading = false;
    // next queue processing calls will stop if stop == true
    stop = false;
    // end of file reached while reading file
    eofReached = false;

    lastReadChunkId = -1;
    callbackCalled = false;
    // amount of uploaded(-ing) chunks that wait a response from server
    chunksWaitingForResponse = 0;

    /**
     * @param {File} file
     * @param {FileStream} stream
     * @param {FileNonceGenerator} nonceGenerator
     * @param {number} maxChunkId
     * @param {function} callback
     */
    constructor(file, stream, nonceGenerator, maxChunkId, callback) {
        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.file.progressMax = maxChunkId;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this.maxChunkId = maxChunkId;
        this.callback = callback;
    }

    start() {
        this._tick();
        console.log(`starting to upload file id: ${this.file.id}`);
    }

    cancel() {
        this.stop = true;
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

    _readChunk() {
        if (this.eofReached || this.stop || this.reading || this.dataChunks.length >= this.dataChunksLimit) return;
        this.reading = true;
       // console.log(`${this.file.id}: chunk ${this.lastReadChunkId + 1} reading`);
        this.stream.read()
            .then(bytesRead => {
                if (bytesRead === 0) {
                    this.eofReached = true;
                    if (this.lastReadChunkId !== this.maxChunkId) {
                        const err = new Error(`Was able to read up to ${this.lastReadChunkId}` +
                                                `chunk id, but max chunk id is${this.maxChunkId}`);
                        console.log(err);
                        console.log(`Upload failed for file ${this.file.fileId}`);
                        this.stop = true;
                        this._callCallback(err);
                    }
                } else {
                    let buffer = this.stream.buffer;
                    if (bytesRead !== buffer.length) {
                        buffer = buffer.slice(0, bytesRead);
                    }
                    this.dataChunks.push({ id: ++this.lastReadChunkId, buffer });
                }
                this.reading = false;
                this._tick();
            })
            .catch(err => {
                console.log(`Failed reading file ${this.file.fileId}. Upload filed.`, err);
                this.stop = true;
                this._callCallback(errors.normalize(err));
            });
    }

    _encryptChunk() {
        if (this.stop || this.encrypting || this.cipherChunks.length >= this.cipherChunksLimit
                || !this.dataChunks.length) return;
        this.encrypting = true;
        const chunk = this.dataChunks.shift();
        // console.log(`${this.file.id}: chunk ${chunk.id} encrypting`);
        chunk.buffer = secret.encrypt(chunk.buffer, this.fileKey,
                                      this.nonceGenerator.getNextNonce(chunk.id === this.maxChunkId),
                                      false, true);
        this.cipherChunks.push(chunk);
        this.encrypting = false;
        this.file.progressBuffer = chunk.id;
        this._tick();
    }

    _uploadChunk() {
        if (this.stop || this.uploading || !this.cipherChunks.length || this.chunksWaitingForResponse > 1) return;
        this.uploading = true;
        const chunk = this.cipherChunks.shift();
      //  console.log(`${this.file.id}: chunk ${chunk.id} uploading...`);
        this.chunksWaitingForResponse++;
        socket.send('/auth/dev/file/upload-chunk', {
            fileId: this.file.fileId,
            chunkNum: chunk.id,
            chunk: chunk.buffer.buffer,
            last: chunk.id === this.maxChunkId
        }).then(() => {
            this.chunksWaitingForResponse--;
            this.file.progress = Math.max(chunk.id, this.file.progress); // response can be out of order
            this._tick();
        }).catch(err => {
            console.log(`Failed uploading file ${this.file.fileId}. Upload filed.`, err);
            this.stop = true;
            this._callCallback(errors.normalize(err));
        });
        this.uploading = false;
        this._tick();
    }

    _checkIfFinished() {
        if (this.eofReached && !this.reading && !this.encrypting && !this.uploading
            && !this.dataChunks.length && !this.cipherChunks.length && !this.chunksWaitingForResponse) {
            console.log(`Successfully done uploading file: ${this.file.fileId}`, this.toString());
            this._callCallback();
        }
    }

    toString() {
        return JSON.stringify({
            fileId: this.file.fileId,
            dataChunksLength: this.dataChunks.length,
            cipherChunksLength: this.cipherChunks.length,
            reading: this.reading,
            encrypting: this.encrypting,
            uploading: this.uploading,
            stop: this.stop,
            eofReached: this.eofReached,
            lastReadChunkId: this.lastReadChunkId,
            maxChunkId: this.maxChunkId,
            callbackCalled: this.callbackCalled
        });
    }

    _tick = () => {
        setTimeout(() => {
            try {
                this._readChunk();
                this._encryptChunk();
                this._uploadChunk();
                this._checkIfFinished();
            } catch (err) {
                console.log(`Upload failed for ${this.file.fileId}`, err, this.toString());
                this.stop = true;
                this._callCallback(errors.normalize(err));
            }
        });
    }

}


module.exports = FileUploader;
