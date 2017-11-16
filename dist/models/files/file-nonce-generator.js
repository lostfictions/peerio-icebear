'use strict';

const util = require('../../crypto/util');

/**
 * Helper class to generate sequential nonces for file chunks.
 * Creates new nonce, or reuses existing one. Chunk Id is zero-based.
 *
 * Nonce consists of 24 bytes
 * ```
 * 1    - last chunk flag. 0 - false, 1 - true
 * 2-5  - chunk counter
 * 6-24 - random
 * ```
 * @param {number} startChunkId - chunk id to start with (next nonce will use this id)
 * @param {number} maxChunkId
 * @param {Uint8Array} nonce - leave empty to generate random one
 * @protected
 */
let FileNonceGenerator = class FileNonceGenerator {
    constructor(startChunkId, maxChunkId, nonce = util.getRandomNonce()) {
        /**
         * @member {Uint8Array}
         * @protected
         */
        this.nonce = nonce;
        /**
         * @member {number}
         * @protected
         */
        this.chunkId = startChunkId;
        /**
         * @member {number}
         * @protected
         */
        this.maxChunkId = maxChunkId;
        this._resetControlBytes();
        /**
         * @member {boolean}
         * @protected
         */
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
     * @throws if called after nonce for maxChunkId was generated
     * @protected
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
};


module.exports = FileNonceGenerator;