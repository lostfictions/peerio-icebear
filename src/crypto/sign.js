
/**
 * Digital signing module
 * @module crypto/sign
 */
const L = require('l.js');
const nacl = require('tweetnacl');

let sign = nacl.sign.detached;
let verify = nacl.sign.detached.verify;

/**
 * Signs the message with secret key and returns detached signature
 * @param {Uint8Array} message
 * @param {Uint8Array} secretKey
 * @returns {Promise<Uint8Array>} signature
 */
function signDetached(message, secretKey) {
    return Promise.resolve(sign(message, secretKey));
}

function verifyDetached(message, signature, publicKey) {
    let result = false;
    try {
        result = verify(message, signature, publicKey);
    } catch (err) {
        L.error(err);
    }
    return Promise.resolve(result);
}

function setImplementation(signFunc, verifyFunc) {
    sign = signFunc;
    verify = verifyFunc;
}

module.exports = { signDetached, verifyDetached, setImplementation };
