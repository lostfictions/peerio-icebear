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

// this is for reference, in the code we use numbers for better comprehension
// const BOXZEROBYTES:number = nacl.lowlevel.crypto_secretbox_BOXZEROBYTES;
// const ZEROBYTES:number = nacl.lowlevel.crypto_secretbox_ZEROBYTES;
// const NONCEBYTES:number = nacl.lowlevel.crypto_secretbox_NONCEBYTES;
const KEYBYTES:number = nacl.lowlevel.crypto_secretbox_KEYBYTES;

// TODO: optimisation: try reusing same large ArrayBuffer for output

/**
 * Encrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox().
 */
exports.encrypt = function(msg1: Uint8Array|string, key: Uint8Array): Uint8Array {
    let msg:Uint8Array;
    // decode string if it was passed instead of byte array
    if (typeof (msg1) === 'string') {
        msg = util.strToBytes(msg1);
    } else if (msg1 instanceof Uint8Array) {
        msg = msg1;
    } else throw new Error('secret.encrypt: first argument (message) should be string or Uint8Array.');

    // validating arguments
    if (!(msg instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEYBYTES)) {
        throw new Error('secret.encrypt: Invalid argument type or key length.');
    }

    // TODO: there must be a way to avoid this allocation and copy
    const m = new Uint8Array(32 + msg.length); /* ZEROBYTES */
    for (let i = 0; i < msg.length; i++) m[i + 32] = msg[i];

    const nonce = util.getRandomNonce();
    // container for cipher bytes concatenated with nonce
    const c1 = new Uint8Array(m.length + 24); /* NONCEBYTES */
    // appending nonce to the end of cipher bytes
    for (let i = 0; i < nonce.length; i++) c1[i + m.length] = nonce[i];
    // view of the same ArrayBuffer for encryption algorythm that does not know about our nonce concatenation
    const c = c1.subarray(0, -24);// TODO: check if we can skip this step
    nacl.lowlevel.crypto_secretbox(c, m, m.length, nonce, key);

    return c1;// contains 16 zero bytes in the beginning
};

/**
 * Decrypts and authenticates data using symmetric encryption.
 * This is a refactored version of nacl.secretbox.open().
 */
exports.decrypt = function(cipher: Uint8Array, key: Uint8Array): Uint8Array {
    if (!(cipher instanceof Uint8Array
        && key instanceof Uint8Array
        && key.length === KEYBYTES
        && cipher.length >= 56)) { /* NONCEBYTES + ZEROBYTES */
        throw new Error('secret.encrypt: Invalid argument type or length.');
    }

    const c = cipher.subarray(0, -24);
    const m = new Uint8Array(c.length);
    if (nacl.lowlevel.crypto_secretbox_open(m, c, c.length, cipher.subarray(-24), key) !== 0) {
        throw Error('Decryption failed.');
    }

    return m.subarray(32); /* ZEROBYTES */
};

