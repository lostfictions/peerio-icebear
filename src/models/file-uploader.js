/**
 * Skynet's little brother who tries hard to remove bottlenecks in the whole
 * "read -> encrypt -> upload" process to maximize upload speed.
 */

const socket = require('../network/socket');

class FileUploader {
    dataChunks = [];
    cipherChunks = [];

    dataChunksLimit = 3;
    cipherChunksLimit = 2;

    reading = false;
    encrypting = false;
    uploading = false;
    stop = false;

    // for upload queue, increments when uploaded
    currentChunkId = 0;

    constructor(file, stream, nonceGenerator, maxChunkId, callback) {
        this.file = file;
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this.maxChunkId = maxChunkId;
        this.callback = callback;
    }

    readChunk() {
        if (this.stop || this.reading || this.dataChunks.length >= this.dataChunksLimit) return;
        this.reading = true;
        // todo: read
        this.tick();
    }

    encryptChunk() {
        if (this.stop || this.encrypting || this.cipherChunks.length >= this.cipherChunksLimit
                || !this.dataChunks.length) return;
        this.encrypting = true;
        // todo: encrypt
        this.tick();
    }

    uploadChunk() {
        if (this.stop || this.uploading || !this.cipherChunks.length) return;
        this.uploading = true;
        // todo: upload

        this.file.progress = Math.floor((this.currentChunkId + 1) / ((this.maxChunkId + 1) / 100));
        this.tick();
    }

    detectFreeze() {
        if (this.stop) return;
        if (/* max chunk not reached &&*/ !this.reading && !this.encrypting && !this.sending
        && !this.dataChunks.length && !this.cipherChunks.length) {
            // frozen
            // todo: callback with error?
        }
    }

    tick = () => {
        this.readChunk();
        this.encryptChunk();
        this.uploadChunk();
        this.detectFreeze();
    }

}


module.exports = FileUploader;
