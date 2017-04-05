/**
 * Peerio Crypto module for key handling.
 * @module crypto/keys
 */
const getScrypt = require('./scrypt-proxy').getScrypt;
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');
const errors = require('../errors');

/**
 * @typedef {Object} KeyPair
 * @property publicKey {Uint8Array}
 * @property secretKey {Uint8Array}
 */

/**
 * ------------------------------------------------------------------------------------------
 * WARNING: changing scrypt params will break compatibility with older scrypt-generated data
 * ------------------------------------------------------------------------------------------
 */

/** Promisified scrypt call */
function scryptPromise(passphrase, salt, options) {
    return new Promise(resolve => {
        getScrypt()(passphrase, salt, options, resolve);
    });
}

/**
 * Prehashes passphrase for stronger key derivation.
 * @param {string} pass
 * @param {[string]} personalization
 */
function prehashPass(pass, personalization) {
    if (personalization) {
        personalization = { personalization: util.strToBytes(personalization) }; // eslint-disable-line
    }
    const prehashedPass = new BLAKE2s(32, personalization);
    prehashedPass.update(util.strToBytes(pass));
    return prehashedPass.digest();
}

/**
 * Deterministically derives boot key and auth key pair.
 * @param {String} username
 * @param {String} passphrase
 * @param {Uint8Array} randomSalt
 */
function deriveAccountKeys(username, passphrase, randomSalt) {
    try {
        // requesting 64 bytes to split them for 2 keys
        const scryptOptions = { N: 16384, r: 8, dkLen: 64, interruptStep: 200 };
        // secure salt - contains username
        const salt = util.concatTypedArrays(util.strToBytes(username), randomSalt);
        const pass = prehashPass(passphrase, 'PeerioPH');

        return scryptPromise(pass, salt, scryptOptions)
            .then(derivedByteArray => {
                const keys = {};
                // first 32 bytes - symmetric boot key
                keys.bootKey = new Uint8Array(derivedByteArray.slice(0, 32));
                // second 32 bytes - secret key of the auth key pair
                const secretKey = new Uint8Array(derivedByteArray.slice(32, 64));
                keys.authKeyPair = nacl.box.keyPair.fromSecretKey(secretKey);
                return keys;
            });
    } catch (ex) {
        return Promise.reject(errors.normalize(ex));
    }
}

/**
 * Derive keys for a ghost/ephemeral user.
 * @param {Uint8Array} salt - e.g. ephemeral ID
 * @param {String} passphrase
 * @returns {Promise<KeyPair>}
 */
function deriveEphemeralKeys(salt, passphrase) {
    try {
        const scryptOptions = { N: 16384, r: 8, dkLen: 32, interruptStep: 200, encoding: 'binary' };
        const pass = prehashPass(passphrase);
        return scryptPromise(pass, salt, scryptOptions)
            .then(keyBytes => nacl.box.keyPair.fromSecretKey(keyBytes));
    } catch (ex) {
        return Promise.reject(errors.normalize(ex));
    }
}

/**
 * @param username
 * @param passcode {String}
 * @returns {Promise<Uint8Array>}
 */
function deriveKeyFromPasscode(username, passcode) {
    try {
        const scryptOptions = { N: 16384, r: 8, dkLen: 32, interruptStep: 200, encoding: 'binary' };
        const salt = util.strToBytes(username);
        const pass = prehashPass(passcode);

        return scryptPromise(pass, salt, scryptOptions);
    } catch (ex) {
        return Promise.reject(errors.normalize(ex));
    }
}

/**
 * Generates new random signing (ed25519) key pair.
 * 32 byte public key and 64 byte secret key.
 */
function generateSigningKeyPair() {
    return nacl.sign.keyPair();
}

/**
 * Generates new random asymmetric (curve25519) key pair.
 */
function generateEncryptionKeyPair() {
    return nacl.box.keyPair();
}

/**
 * Generates new random symmetric (xsalsa20) 32 byte secret key.
 */
function generateEncryptionKey() {
    return util.getRandomBytes(32);
}

/**
 * Generates new salt for auth process
 */
function generateAuthSalt() {
    return util.getRandomBytes(32);
}

/**
 * Hashes auth public key
 */
function getAuthKeyHash(key) {
    const hash = new BLAKE2s(32, { personalization: util.strToBytes('AuthCPK1') });
    hash.update(key);
    return hash.digest();
}


module.exports = {
    deriveAccountKeys,
    deriveEphemeralKeys,
    deriveKeyFromPasscode,
    generateSigningKeyPair,
    generateEncryptionKeyPair,
    generateEncryptionKey,
    generateAuthSalt,
    getAuthKeyHash
};
