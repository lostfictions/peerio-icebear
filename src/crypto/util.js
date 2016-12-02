
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

/** Generates 24-byte unique(almost) random nonce. */
function getRandomNonce() {
    const nonce = new Uint8Array(24);
    // we take last 4 bytes of current timestamp
    nonce.set(numberToByteArray(Date.now() >>> 32));
    // and 20 random bytes
    nonce.set(getRandomBytes(20), 4);
    return nonce;
}

/**
 * Generates 32-byte unique random fileId.
 * @returns {string} - B64 encoded 42 bytes [16: username+timestamp hash][26: random bytes]
 */
const fileIdLength = 42;
const fileIdHashPartLength = 16;
const fileIdRandomPartLength = fileIdLength - fileIdHashPartLength; // 26
function getRandomFileId(username) {
    const fileId = new Uint8Array(fileIdLength);
    const hash = getByteHash(fileIdHashPartLength, strToBytes(username + Date.now().toString()));
    fileId.set(hash);
    fileId.set(getRandomBytes(fileIdRandomPartLength), fileIdHashPartLength);
    return bytesToB64(fileId);
}


const converterDataView = new DataView(new ArrayBuffer(4));
function numberToByteArray(num) {
    converterDataView.setUint32(0, num);
    return new Uint8Array(converterDataView.buffer.slice(0));
}

function byteArrayToNumber(arr, offset, length) {
    return new DataView(arr.buffer, offset, length).getUint32(0);
}

function arrayBufferToNumber(arr, offset, length) {
    return new DataView(arr, offset, length).getUint32(0);
}

/**
 * Hashes a value.
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @returns {string} - hex encoded string hash
 */
function getHexHash(length, value) {
    const h = new BLAKE2s(length);
    h.update(value);
    return h.hexDigest();
}

/**
 * Hashes a value.
 * @param {number} length - hash length 1-32
 * @param {Uint8Array} value - value to hash
 * @returns {Uint8Array} - hex encoded string hash
 */
function getByteHash(length, value) {
    const h = new BLAKE2s(length);
    h.update(value);
    return h.digest();
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
    getRandomFileId,
    bytesToB64,
    b64ToBytes,
    bytesToStr,
    strToBytes,
    numberToByteArray,
    byteArrayToNumber,
    arrayBufferToNumber,
    concatTypedArrays,
    getHexHash,
    getByteHash,
    getEncryptedByteHash
};
