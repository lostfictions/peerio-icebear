
/**
 * Digital signing module
 * @module crypto/sign
 */

 const nacl = require('tweetnacl');
 // const util = require('./util');
 // const { DecryptionError } = require('../errors');

/** Signs the message with secret key and returns detached signature*/
 exports.sign = function(message, secretKey) {
     return nacl.sign.detached(message, secretKey);
 };
