/*
 * Peerio Crypto module for key handling.
 */

const scrypt = require('scrypt-async');
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');

const passHashPersonalization = {
    personalization: util.strToBytes('PeerioPH')
};

// deterministically derives boot key and auth key pair
function deriveKeys(username, passphrase, salt) {
    return new Promise((resolve, reject) => {
        const prehashed = new BLAKE2s(32, passHashPersonalization);
        prehashed.update(util.strToBytes(passphrase));
        const fullSalt = util.concatBuffers(util.strToBytes(username), salt);

        // warning: changing scrypt params will break compatibility with older scrypt-generated data
        scrypt(prehashed.digest(), fullSalt, 14, 8, 64, 1000, derivedBytes => {
            const keys = {};
            try {
                keys.bootKey = new Uint8Array(derivedBytes.slice(0, 32));
                const secretKey = new Uint8Array(derivedBytes.slice(32, 64));
                keys.authKeyPair = nacl.box.keyPair.fromSecretKey(secretKey);
            } catch (ex) {
                reject(ex);
            }
            resolve(keys);
        });
    });
}

// Generates new random ed25519 key pair
function generateSigningKeys() {
    return nacl.sign.keyPair();
}

module.exports = {
    deriveKeys,
    generateSigningKeys
};
