const util = require('../crypto/util');

/**
 * Helper class to generate sequential nonces for file chunks.
 * Nonce consists of 24 bytes
 * 1    - last chunk flag. 0 - false, 1 - true
 * 2-5  - chunk counter
 * 6-24 - random
 */
class FileNonceGenerator {
    /**
     * Creates new nonce, or reuses existing one
     * @param {[Uint8Array]} nonce
     */
    constructor(nonce = util.getRandomNonce()) {
        this.nonce = nonce;
        this.chunkId = -1;
        this._resetControlBytes();
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
    }

    /**
     * @returns {Uint8Array|null} - nonce for the next chunk
     */
    getNextNonce(last) {
        this.chunkId++;
        this._writeChunkNum();
        if (last) this._writeLastChunkFlag();
        return this.nonce;
    }

}


module.exports = FileNonceGenerator;
