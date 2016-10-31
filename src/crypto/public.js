/**
 * Public key encryption module
 * @module crypto/public
 */

const nacl = require('tweetnacl');
const secret = require('./secret');
// const util = require('./util');
const { DecryptionError } = require('../errors');

/**
 * This is a classic variant of decryption function for server compatibility
 */
module.exports.decryptCompat = function(cipher, nonce, publicKey, secretKey) {
    // underlying buffer is > then ciphertext, this can lead to numerous bugs, so we slice it
    const decrypted = nacl.box.open(cipher, nonce, publicKey, secretKey).slice();
    if (decrypted === false) throw new DecryptionError();
    return decrypted;
};

module.exports.encrypt = function(msgBytes, theirPublicKey, mySecretKey) {
    const sharedKey = nacl.box.before(theirPublicKey, mySecretKey);
    return secret.encrypt(msgBytes, sharedKey);
};

module.exports.decrypt = function(cipher, theirPublicKey, mySecretKey) {
    const sharedKey = nacl.box.before(theirPublicKey, mySecretKey);
    return secret.decrypt(cipher, sharedKey);
};
