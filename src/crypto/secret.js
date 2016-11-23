
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

const nacl = require('tweetnacl');
const util = require('./util');
const { EncryptionError, DecryptionError } = require('../errors');

// this is for reference, in the code we use numbers for better comprehension
// const BOXZEROBYTES = nacl.lowlevel.crypto_secretbox_BOXZEROBYTES;
// const ZEROBYTES = nacl.lowlevel.crypto_secretbox_ZEROBYTES;
// const NONCEBYTES = nacl.lowlevel.crypto_secretbox_NONCEBYTES;
// const KEY_LENGTH = nacl.lowlevel.crypto_secretbox_KEYBYTES;

// IDEA: try reusing same large ArrayBuffer for output

/**
 * Encrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox().
 * @param {Uint8Array} msgBytes
 * @param {Uint8Array} key
 * @param {[Uint8Array]} nonce - (24 byte) in case you have want to set your own nonce instead of random one
 * @param {boolean} appendNonce - default 'true'
 */
exports.encrypt = function(msgBytes, key, nonce = util.getRandomNonce(), appendNonce = true) {
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
    for (let i = 32; i < fullMsgLength; i++) m[i] = msgBytes[i];

    let c;
    if (appendNonce) {
        // container for cipher bytes concatenated with nonce
        c = new Uint8Array(m.length + 24); /* NONCEBYTES */
        // appending nonce to the end of cipher bytes
        for (let i = 0; i < nonce.length; i++) c[i + m.length] = nonce[i];
    } else c = new Uint8Array(m.length);
    // view of the same ArrayBuffer for encryption algorithm that does not know about our nonce concatenation
    nacl.lowlevel.crypto_secretbox(appendNonce ? c.subarray(0, -24) : c, m, m.length, nonce, key);

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
 */
exports.decrypt = function(cipher, key, nonce) {
    /*
    if (!(cipher instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEY_LENGTH
        && cipher.length >= 56)) {
        throw new DecryptionError('secret.decrypt: Invalid argument type or length.');
    }
    */
    const c = nonce ? cipher : cipher.subarray(0, -24);
    const m = new Uint8Array(c.length);
    if (nacl.lowlevel.crypto_secretbox_open(m, c, c.length, nonce || cipher.subarray(-24), key) !== 0) {
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
