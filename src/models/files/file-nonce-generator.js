const util = require('../../crypto/util');

/**
 * Helper class to generate sequential nonces for file chunks.
 * Nonce consists of 24 bytes
 * 1    - last chunk flag. 0 - false, 1 - true
 * 2-5  - chunk counter
 * 6-24 - random
 */
class FileNonceGenerator {
    /**
     * Creates new nonce, or reuses existing one.
     * Chunk Id is zero-based.
     * @param {number} startChunkId - chunk id to start with (next nonce will use this id)
     * @param {number} maxChunkId
     * @param {Uint8Array} nonce - leave empty to generate random one
     */
    constructor(startChunkId, maxChunkId, nonce = util.getRandomNonce()) {
        this.nonce = nonce;
        this.chunkId = startChunkId;
        this.maxChunkId = maxChunkId;
        this._resetControlBytes();
        this.eof = false;
    }

    _resetControlBytes() {
        this.nonce.set([0, 0, 0, 0, 0]);
    }

    _writeChunkNum() {
        const bytes = util.numberToByteArray(this.chunkId);
        this.nonce.set(bytes, 1);
    }

    _writeLastChunkFlag() {
        this.nonce[0] = 1;
        this.eof = true;
    }

    /**
     * @returns {Uint8Array|null} - nonce for the next chunk
     */
    getNextNonce() {
        if (this.eof) throw new Error('Attempt to generate nonce past maxChunkId.');
        this._writeChunkNum();
        if (this.chunkId === this.maxChunkId) {
            this._writeLastChunkFlag();
        } else {
            this.chunkId++;
        }
        return this.nonce;
    }

}


module.exports = FileNonceGenerator;
