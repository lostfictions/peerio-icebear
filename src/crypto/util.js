
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
let getRandomBytes = function(num) {
    return crypto.getRandomValues(new Uint8Array(num));
};

// node version.
// todo: maybe this is not the best way to detect node runtime :-D
if (global && !global.crypto) {
    const crypto = global.cryptoShim;
    console.log(`cryptoShim: ${crypto}`);
    getRandomBytes = function(num) {
        return crypto.randomBytes(num);
    };
}

function getRandomNumber(min, max) {
    const range = max - min;

    const bitsNeeded = Math.ceil(Math.log2(range));
    if (bitsNeeded > 31) {
        throw new Error('Range too big for getRandomNumber().');
    }
    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const mask = Math.pow(2, bitsNeeded) - 1;

    let rval = 0;

    do {
        const byteArray = getRandomBytes(bytesNeeded);
        rval = 0;

        let p = (bytesNeeded - 1) * 8;
        for (let i = 0; i < bytesNeeded; i++) {
            rval += byteArray[i] * Math.pow(2, p);
            p -= 8;
        }
        rval &= mask;
    } while (rval >= range);

    return min + rval;
}

/**
 * Concatenates two Uint8Arrays.
 * Returns new concatenated array.
 */
function concatTypedArrays(buffer1, buffer2) {
    const joined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    joined.set(new Uint8Array(buffer1), 0);
    joined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return joined;
}

/**
 * Converts UTF8 string to byte array.
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
function strToBytes(str) {
    if (HAS_TEXT_ENCODER) {
        return textEncoder.encode(str);
    }
    // returning Buffer instance will break deep equality tests since Buffer modifies prototype
    return new Uint8Array(Buffer.from(str, 'utf-8').buffer);
}

/**
 * Converts byte array to UTF8 string .
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
function bytesToStr(bytes) {
    if (HAS_TEXT_ENCODER) {
        return textDecoder.decode(bytes);
    }
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf-8');
}

/** Converts Base64 string to byte array. */
function b64ToBytes(str) {
    return new Uint8Array(Buffer.from(str, 'base64').buffer);
}

/** Converts byte array to Base64 string. */
function bytesToB64(bytes) {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
}

function bytesToHex(bytes) {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('hex');
}

function hexToBytes(str) {
    return new Uint8Array(Buffer.from(str, 'hex').buffer);
}

/** Generates 24-byte unique(almost) random nonce. */
function getRandomNonce() {
    const nonce = new Uint8Array(24);
    // we take last 4 bytes of currentDict timestamp
    nonce.set(numberToByteArray(Date.now() >>> 32));
    // and 20 random bytes
    nonce.set(getRandomBytes(20), 4);
    return nonce;
}

/**
 * Generator for 32-byte unique random user-specific ids used for files and ghosts.
 */
const randomIdLength = 42;
const randomIdHashPartLength = 16;
const randomIdRandomPartLength = randomIdLength - randomIdHashPartLength; // 26

/**
 * Generates random id bytes.
 *
 * @param {String} username
 * @returns {Uint8Array} 42 bytes [16: username+timestamp hash][26: random bytes]
 * @private
 */
function _getRandomUserSpecificIdBytes(username) {
    const fileId = new Uint8Array(randomIdLength);
    const hash = getByteHash(randomIdHashPartLength, strToBytes(username + Date.now().toString()));
    fileId.set(hash);
    fileId.set(getRandomBytes(randomIdRandomPartLength), randomIdHashPartLength);
    return fileId;
}

/**
 * Random ID in base64.
 *
 * @param {String} username
 * @returns {String} base64 encoding
 */
function getRandomUserSpecificIdB64(username) {
    return bytesToB64(_getRandomUserSpecificIdBytes(username));
}

/**
 * Random ID in hex.
 *
 * @param {String} username
 * @returns {String} hex encoding
 */
function getRandomUserSpecificIdHex(username) {
    return bytesToHex(_getRandomUserSpecificIdBytes(username));
}

const converterDataView = new DataView(new ArrayBuffer(4));
function numberToByteArray(num) {
    converterDataView.setUint32(0, num);
    return new Uint8Array(converterDataView.buffer.slice(0));
}

function byteArrayToNumber(arr, offset, length) {
    // safari doesn't like undefined params
    return new DataView(arr.buffer, offset || 0, length || arr.byteLength).getUint32(0);
}

function arrayBufferToNumber(arr, offset, length) {
    // safari doesn't like undefined params
    return new DataView(arr, offset || 0, length || arr.byteLength).getUint32(0);
}

/**
 * Adds 0 bytes to the end of a uint8array until it is length bytes long.
 *
 * @param {Uint8Array} u
 * @param {Number} length
 */
function padBytes(u, length) {
    const newBytes = new Uint8Array(length).fill(0);
    newBytes.set(u);
    return newBytes;
}
/**
 * Hashes a value.
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @param {String} personalizationString [optional]
 * @returns {BLAKE2s}
 * @private
 */
function _getHash(length, value, personalizationString) {
    const personalization = personalizationString ? {
        personalization: padBytes(strToBytes(personalizationString), 8)
    } : undefined;
    const h = new BLAKE2s(length, personalization);
    h.update(value);
    return h;
}

/**
 * Hashes a value and returns hex string.
 *
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @param {String} personalizationString [optional]
 * @returns {string} - hex encoded string hash
 */
function getHexHash(length, value, personalizationString) {
    return _getHash(length, value, personalizationString).hexDigest();
}

/**
 * Hashes a value and returns bytes.
 *
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @param {String} personalizationString [optional]
 * @returns {Uint8Array} - hex encoded string hash
 */
function getByteHash(length, value, personalizationString) {
    return _getHash(length, value, personalizationString).digest();
}

function getEncryptedByteHash(length, value) {
    const key = getRandomBytes(BLAKE2s.keyLength);
    const salt = getRandomBytes(BLAKE2s.saltLength);
    const h = new BLAKE2s(length, { key, salt });
    h.update(value);
    return h.digest();
}

module.exports = {
    getRandomBytes,
    getRandomNumber,
    getRandomNonce,
    getRandomUserSpecificIdB64,
    getRandomUserSpecificIdHex,
    bytesToB64,
    b64ToBytes,
    bytesToStr,
    bytesToHex,
    hexToBytes,
    strToBytes,
    numberToByteArray,
    byteArrayToNumber,
    arrayBufferToNumber,
    concatTypedArrays,
    getHexHash,
    getByteHash,
    getEncryptedByteHash
};
