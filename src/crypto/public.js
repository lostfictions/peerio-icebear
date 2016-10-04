// @flow
/**
 * Public key encryption module
 * @module crypto/public
 */

 const nacl = require('tweetnacl');
 // const util = require('./util');
 const { DecryptionError } = require('../errors');

 exports.decrypt = function(cipher: Uint8Array, nonce: Uint8Array,
                                publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array {
      // underlying buffer is > then ciphertext, this can lead to numerous bugs, so we slice it
     const decrypted = nacl.box.open(cipher, nonce, publicKey, secretKey).slice();
     if (decrypted === false) throw new DecryptionError();
     return decrypted;
 };
