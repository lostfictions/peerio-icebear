/**
 * Public key encryption module
 * @module crypto/public
 */

const nacl = require('tweetnacl');
const secret = require('./secret');
const { DecryptionError } = require('../errors');

/**
 * This is a classic variant of decryption function for server compatibility -- ie.
 * used for decrypting authTokens and other tokens.
 * @param {Uint8Array} cipher
 * @param {Uint8Array} nonce
 * @param {Uint8Array} theirPublicKey
 * @param {Uint8Array} mySecretKey
 * @return {Uint8Array}
 */
function decryptCompat(cipher, nonce, theirPublicKey, mySecretKey) {
    const decrypted = nacl.box.open(cipher, nonce, theirPublicKey, mySecretKey);
    if (decrypted === false) throw new DecryptionError();
    // underlying buffer is > then ciphertext, this can lead to numerous bugs, so we slice it
    return decrypted.slice();
}

/**
 * Encrypt
 * @param {Uint8Array} msgBytes
 * @param {Uint8Array} theirPublicKey
 * @param {Uint8Array} mySecretKey
 * @return {Uint8Array}
 */
function encrypt(msgBytes, theirPublicKey, mySecretKey) {
    const sharedKey = nacl.box.before(theirPublicKey, mySecretKey);
    return secret.encrypt(msgBytes, sharedKey);
}

/**
 * Decrypt
 * @param {Uint8Array} cipher
 * @param {Uint8Array} theirPublicKey
 * @param {Uint8Array} mySecretKey
 * @return {Uint8Array}
 */
function decrypt(cipher, theirPublicKey, mySecretKey) {
    const sharedKey = nacl.box.before(theirPublicKey, mySecretKey);
    return secret.decrypt(cipher, sharedKey);
}

module.exports = { decryptCompat, encrypt, decrypt, computeSharedKey: nacl.box.before };
