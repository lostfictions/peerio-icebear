// @flow
/**
 * Digital signing module
 * @module crypto/sign
 */

 const nacl = require('tweetnacl');
 // const util = require('./util');
 // const { DecryptionError } = require('../errors');

/** Signs the message with secret key and returns detached signature*/
 exports.sign = function(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
     return nacl.sign.detached(message, secretKey);
 };
