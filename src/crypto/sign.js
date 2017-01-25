
/**
 * Digital signing module
 * @module crypto/sign
 */

const nacl = require('tweetnacl');
// const util = require('./util');
// const { DecryptionError } = require('../errors');

/** Signs the message with secret key and returns detached signature*/
function signDetached(message, secretKey) {
    return nacl.sign.detached(message, secretKey);
}

function verifyDetached(message, signature, publicKey) {
    try {
        return nacl.sign.detached.verify(message, signature, publicKey);
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = { signDetached, verifyDetached };
