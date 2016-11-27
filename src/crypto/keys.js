
/**
 * Peerio Crypto module for key handling.
 * @module crypto/keys
 */
const scrypt = require('scrypt-async');
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');
const err = require('../errors');

/**
 * @typedef {Object} KeyPair
 * @property publicKey {Uint8Array}
 * @property secretKey {Uint8Array}
 */

/**
 * Deterministically derives boot key and auth key pair.
 */
exports.deriveKeys = function(username, passphrase, salt) {
    return new Promise((resolve, reject) => {
        const prehashed = new BLAKE2s(32, { personalization: util.strToBytes('PeerioPH') });
        prehashed.update(util.strToBytes(passphrase));
        const fullSalt = util.concatTypedArrays(util.strToBytes(username), salt);
        const options = {
            N: 16384,
            r: 8,
            dkLen: 64,
            interruptStep: 200
        };

        // warning: changing scrypt params will break compatibility with older scrypt-generated data
        // params: password, salt, resource cost, block size, key length, async interrupt step (ms.)
        scrypt(prehashed.digest(), fullSalt, options, (derivedBytes) => {
            const keys = {};
            try {
                keys.bootKey = new Uint8Array(derivedBytes.slice(0, 32));
                const secretKey = new Uint8Array(derivedBytes.slice(32, 64));
                keys.authKeyPair = nacl.box.keyPair.fromSecretKey(secretKey);
            } catch (ex) {
                reject(err.normalize(ex, 'Scrypt callback exception.'));
            }
            resolve(keys);
        });
    });
};

/**
 * Generates new random signing (ed25519) key pair.
 * 32 byte public key and 64 byte secret key.
 */
exports.generateSigningKeyPair = function() {
    return nacl.sign.keyPair();
};

/**
 * Generates new random asymmetric (curve25519) key pair.
 */
exports.generateEncryptionKeyPair = function() {
    return nacl.box.keyPair();
};

/**
 * Generates new random symmetric (xsalsa20) 32 byte secret key.
 */
exports.generateEncryptionKey = function() {
    return util.getRandomBytes(32);
};

/**
 * Generates new salt for auth process
 */
exports.generateAuthSalt = function() {
    return util.getRandomBytes(32);
};

/**
 * Hashes auth public key
 */
exports.getAuthKeyHash = function(key) {
    const hash = new BLAKE2s(32, { personalization: util.strToBytes('AuthCPK1') });
    hash.update(key);
    return hash.digest();
};

/**
 * @param passcode {String}
 * @returns {Promise<Uint8Array>}
 */
exports.deriveKeyFromPasscode = function(username, passcode) {
    const keySize = 32;
    const options = {
        N: 16384,
        r: 8,
        dkLen: 32,
        interruptStep: 200
    };

    return new Promise(resolve => {
        const hash = new BLAKE2s(keySize);
        hash.update(util.strToBytes(passcode));
        // warning: changing scrypt params will break compatibility with older scrypt-generated data
        // params: password, salt, resource cost, block size, key length, async interrupt step (ms.)
        scrypt(hash.hexDigest(), util.strToBytes(username), options, resolve);
    }).then(keyBytes => new Uint8Array(keyBytes));
};
