// @flow
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
// const BOXZEROBYTES:number = nacl.lowlevel.crypto_secretbox_BOXZEROBYTES;
// const ZEROBYTES:number = nacl.lowlevel.crypto_secretbox_ZEROBYTES;
// const NONCEBYTES:number = nacl.lowlevel.crypto_secretbox_NONCEBYTES;
const KEY_LENGTH:number = nacl.lowlevel.crypto_secretbox_KEYBYTES;

// IDEA: try reusing same large ArrayBuffer for output

/**
 * Encrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox().
 */
exports.encrypt = function(msgBytes: Uint8Array, key: Uint8Array): Uint8Array {
    // validating arguments
    if (!(msgBytes instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEY_LENGTH)) {
        throw new EncryptionError('secret.encrypt: Invalid argument type or key length.');
    }

    // IDEA: there must be a way to avoid this allocation and copy
    const m: Uint8Array = new Uint8Array(32 + msgBytes.length); /* ZEROBYTES */
    for (let i: number = 0; i < msgBytes.length; i++) m[i + 32] = msgBytes[i];

    const nonce: Uint8Array = util.getRandomNonce();
    // container for cipher bytes concatenated with nonce
    const c1: Uint8Array = new Uint8Array(m.length + 24); /* NONCEBYTES */
    // appending nonce to the end of cipher bytes
    for (let i: number = 0; i < nonce.length; i++) c1[i + m.length] = nonce[i];
    // view of the same ArrayBuffer for encryption algorythm that does not know about our nonce concatenation
    const c: Uint8Array = c1.subarray(0, -24);// IDEA: check if we can skip this step
    nacl.lowlevel.crypto_secretbox(c, m, m.length, nonce, key);

    return c1;// contains 16 zero bytes in the beginning
};

/**
 * Helper method to decode string to bytes and encrypt it.
 */
exports.encryptString = function(msg: string, key: Uint8Array): Uint8Array {
    const msgBytes: Uint8Array = util.strToBytes(msg);
    return exports.encrypt(msgBytes, key);
};

/**
 * Decrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox.open().
 */
exports.decrypt = function(cipher: Uint8Array, key: Uint8Array): Uint8Array {
    if (!(cipher instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEY_LENGTH
        && cipher.length >= 56)) { /* NONCEBYTES + ZEROBYTES */
        throw new DecryptionError('secret.decrypt: Invalid argument type or length.');
    }

    const c: Uint8Array = cipher.subarray(0, -24);
    const m: Uint8Array = new Uint8Array(c.length);
    if (nacl.lowlevel.crypto_secretbox_open(m, c, c.length, cipher.subarray(-24), key) !== 0) {
        throw new DecryptionError('Decryption failed.');
    }

    return m.subarray(32); /* ZEROBYTES */
};


/**
 * Helper method to decode decrypted data to a string.
 */
exports.decryptString = function(cipher: Uint8Array, key: Uint8Array): string {
    return util.bytesToStr(exports.decrypt(cipher, key));
};
