
/* eslint-disable global-require */
/**
 * Peerio Crypto Utilities module.
 * @module crypto/util
 */
const Buffer = require('buffer/').Buffer;
const BLAKE2s = require('blake2s-js');

const HAS_TEXT_ENCODER = (typeof TextEncoder !== 'undefined') && (typeof TextDecoder !== 'undefined');
const textEncoder = HAS_TEXT_ENCODER ? new TextEncoder('utf-8') : null;
const textDecoder = HAS_TEXT_ENCODER ? new TextDecoder('utf-8') : null;

/**
 * Universal access to secure PRNG
 * browser version
 */
exports.getRandomBytes = function(num) {
    return crypto.getRandomValues(new Uint8Array(num));
};

// node version.
// tobo: maybe this is not the best way to detect node runtime :-D
if (global && !global.crypto) {
    const crypto = require('crypto');
    exports.getRandomBytes = function(num) {
        return crypto.randomBytes(num);
    };
}

exports.getRandomNumber = function getRandomNumber(min, max) {
    const range = max - min;

    const bitsNeeded = Math.ceil(Math.log2(range));
    if (bitsNeeded > 31) {
        throw new Error('Range too big for getRandomNumber().');
    }
    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const mask = Math.pow(2, bitsNeeded) - 1;

    let rval = 0;

    do {
        const byteArray = exports.getRandomBytes(bytesNeeded);
        rval = 0;

        let p = (bytesNeeded - 1) * 8;
        for (let i = 0; i < bytesNeeded; i++) {
            rval += byteArray[i] * Math.pow(2, p);
            p -= 8;
        }
        rval &= mask;
    } while (rval >= range);

    return min + rval;
};

/**
 * Concatenates two Uint8Arrays.
 * Returns new concatenated array.
 */
exports.concatTypedArrays = function(buffer1, buffer2) {
    const joined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    joined.set(new Uint8Array(buffer1), 0);
    joined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return joined;
};

/**
 * Converts UTF8 string to byte array.
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
exports.strToBytes = function(str) {
    if (HAS_TEXT_ENCODER) {
        return textEncoder.encode(str);
    }
    // returning Buffer instance will break deep equality tests since Buffer modifies prototype
    return new Uint8Array(Buffer.from(str, 'utf-8').buffer);
};

/**
 * Converts byte array to UTF8 string .
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
exports.bytesToStr = function(bytes) {
    if (HAS_TEXT_ENCODER) {
        return textDecoder.decode(bytes);
    }
    return Buffer.fromTypedArray(bytes).toString('utf-8');
};

/** Converts Base64 string to byte array. */
exports.b64ToBytes = function(str) {
    return new Uint8Array(Buffer.from(str, 'base64').buffer);
};
/** Converts byte array to Base64 string. */
exports.bytesToB64 = function(bytes) {
    return Buffer.fromTypedArray(bytes).toString('base64');
};

/** Generates 24-byte unique(almost) random nonce. */
exports.getRandomNonce = function() {
    const nonce = new Uint8Array(24);
    // we take last 4 bytes of current timestamp
    nonce.set(numberToByteArray(Date.now() >>> 32));
    // and 20 random bytes
    nonce.set(exports.getRandomBytes(20), 4);
    return nonce;
};

function numberToByteArray(num) {
    return [num & 0xff, (num >>> 8) & 0xff, (num >>> 16) & 0xff, num >>> 24];
}

/**
 * Hashes a value.
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @returns {string} - hex encoded string hash
 */
exports.getHexHash = function(length, value) {
    const h = new BLAKE2s(length);
    h.update(value);
    return h.hexDigest();
};
