// @flow
/**
 * Secret key encryption module
 * @module crypto/secret
 */

const nacl = require('tweetnacl');
const util = require('./util');

const NONCE_LENGTH = 24;

exports.encrypt = function(data: Uint8Array, key: Uint8Array): Uint8Array {
    const nonce = util.getRandomNonce();
    const encrypted = nacl.secretbox(data, nonce, key);
    return util.concatTypedArrays(nonce, encrypted);
};

exports.decrypt = function(encrypted: Uint8Array, key: Uint8Array): Uint8Array {
    return nacl.secretbox.open(encrypted.subarray(NONCE_LENGTH), encrypted.subarray(0, NONCE_LENGTH), key);
};
