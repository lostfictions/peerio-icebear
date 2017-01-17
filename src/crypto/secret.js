
/**
 * Secret key encryption module.
 * encrypt and decrypt functions replace nacl.secretbox and nacl.secretbox.open.
 * This replacement reduces the amount of memory allocation and copy operations.
 * The output cipher bytes have following differences with nacl.secretbox output:
 * - nonce is appended to the cipher bytes.
 * - 16 BOXZEROBYTES in the beginning of cipher bytes are not stripped and another 16 are appended to them
 *
 * Cipherbytes structure:
 * [ 32 zero bytes ][ actual cipher bytes ][ 24-byte nonce]
 *
 * @module crypto/secret
 */

// IDEA: try reusing same large ArrayBuffer for output
const nacl = require('tweetnacl');
const util = require('./util');
const { DecryptionError } = require('../errors');

const NONCE_SIZE = 24;

/**
 * Encrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox().
 * @param {Uint8Array} msgBytes
 * @param {Uint8Array} key
 * @param {[Uint8Array]} nonce - (24 byte) in case you have want to set your own nonce instead of random one
 * @param {boolean} appendNonce - default 'true'
 * @param {boolean} prependLength - if true - adds 4 bytes containing message length to the beginning
 */
exports.encrypt = function(msgBytes, key, nonce = util.getRandomNonce(),
                           appendNonce = true, prependLength = false) {
    // validating arguments
    // todo: do we need this validation, or encryption failed due to invalid args is not a security issue?
    /*
    if (!(msgBytes instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEY_LENGTH)) {
        throw new EncryptionError('secret.encrypt: Invalid argument type or key length.');
    }
    */
    // todo: there must be a way to avoid this allocation and copy(change tweetnacl.js?)
    const fullMsgLength = 32 + msgBytes.length; /* ZEROBYTES */
    const m = new Uint8Array(fullMsgLength);
    for (let i = 32; i < fullMsgLength; i++) m[i] = msgBytes[i - 32];

    const lengthAdded = (appendNonce ? NONCE_SIZE : 0) + (prependLength ? 4 : 0);
        // container for cipher bytes
    const c = new Uint8Array(m.length + lengthAdded);
    if (appendNonce) {
        for (let i = 0; i < NONCE_SIZE; i++) c[c.length - NONCE_SIZE + i] = nonce[i];
    }
    if (prependLength) {
        const l = util.numberToByteArray(c.length - 4);
        for (let i = 0; i < 4; i++) c[i] = l[i];
    }
    // view of the same ArrayBuffer for encryption algorithm that does not know about our nonce concatenation
    const input = lengthAdded ? c.subarray(prependLength ? 4 : 0, appendNonce ? -NONCE_SIZE : undefined) : c;
    // view of the same ArrayBuffer for encryption algorithm that does not know about our nonce concatenation
    let cipherContainer = c; // default value
    if (lengthAdded) {
        const start = prependLength ? 4 : 0;
        if (appendNonce) {
            cipherContainer = c.subarray(start, -NONCE_SIZE);
        } else {
            cipherContainer = c.subarray(start);
        }
    }
    nacl.lowlevel.crypto_secretbox(cipherContainer, m, m.length, nonce, key);
    return c;// contains 16 zero bytes in the beginning, needed for decryption
};

/**
 * Helper method to decode string to bytes and encrypt it.
 */
exports.encryptString = function(msg, key) {
    const msgBytes = util.strToBytes(msg);
    return exports.encrypt(msgBytes, key);
};

/**
 * Decrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox.open().
 * @param {Uint8Array} cipher - cipher bytes with 16 zerobytes prepended and optionally appended nonce
 * @param {Uint8Array} key
 * @param {[Uint8Array]} nonce - optional nonce (specify when it's not appended to cipher bytes)
 * @param {[boolean]} containsLength
 */
exports.decrypt = function(cipher, key, nonce, containsLength) {
    /*
    if (!(cipher instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEY_LENGTH
        && cipher.length >= 56)) {
        throw new DecryptionError('secret.decrypt: Invalid argument type or length.');
    }
    */
    let start = 0, end;
    if (!nonce) {
        nonce = cipher.subarray(-NONCE_SIZE); //eslint-disable-line
        end = -NONCE_SIZE;
    }
    if (containsLength) {
        start = 4;
    }

    let c = cipher;
    if (start || end) {
        c = c.subarray(start, end);
    }
    const m = new Uint8Array(c.length);
    if (nacl.lowlevel.crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) {
        throw new DecryptionError('Decryption failed.');
    }
    return m.subarray(32); /* ZEROBYTES */
};


/**
 * Helper method to decode decrypted data to a string.
 */
exports.decryptString = function(cipher, key) {
    return util.bytesToStr(exports.decrypt(cipher, key));
};
