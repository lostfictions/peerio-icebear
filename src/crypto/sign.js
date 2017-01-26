
/**
 * Digital signing module
 * @module crypto/sign
 */

const nacl = require('tweetnacl');

/**
 * Signs the message with secret key and returns detached signature
 * @param {Uint8Array} message
 * @param {Uint8Array} secretKey
 * @returns {Uint8Array} signature
 */
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
