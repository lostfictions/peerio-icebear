
/**
 * Digital signing module
 * @module crypto/sign
 */

const nacl = require('tweetnacl');

let detached = nacl.sign.detached;
let verify = nacl.sign.detached.verify;

/**
 * Signs the message with secret key and returns detached signature
 * @param {Uint8Array} message
 * @param {Uint8Array} secretKey
 * @returns {Promise<Uint8Array>} signature
 */
function signDetached(message, secretKey) {
    return Promise.resolve(detached(message, secretKey));
}

function verifyDetached(message, signature, publicKey) {
    let result = false;
    try {
        result = verify(message, signature, publicKey);
    } catch (err) {
        console.error(err);
    }
    return Promise.resolve(result);
}

function setDetachedVerify(detachedFunc, verifyFunc) {
    detached = detachedFunc;
    verify = verifyFunc;
}

module.exports = { signDetached, verifyDetached, setDetachedVerify };
