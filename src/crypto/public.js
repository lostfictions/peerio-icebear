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
     const decrypted = nacl.box.open(cipher, nonce, publicKey, secretKey);
     if (decrypted === false) throw new DecryptionError();
     return decrypted;
 };
