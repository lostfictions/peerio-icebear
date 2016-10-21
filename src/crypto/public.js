
/**
 * Public key encryption module
 * @module crypto/public
 */

 const nacl = require('tweetnacl');
 // const util = require('./util');
 const { DecryptionError } = require('../errors');

 exports.decrypt = function(cipher, nonce,
                                publicKey, secretKey) {
      // underlying buffer is > then ciphertext, this can lead to numerous bugs, so we slice it
     const decrypted = nacl.box.open(cipher, nonce, publicKey, secretKey).slice();
     if (decrypted === false) throw new DecryptionError();
     return decrypted;
 };
