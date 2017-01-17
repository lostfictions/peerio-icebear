
/**
 * Peerio Crypto module for key handling.
 * @module crypto/keys
 */
const scrypt = require('scrypt-async');
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');
const err = require('../errors');
const _ = require('lodash');

/**
 * @typedef {Object} KeyPair
 * @property publicKey {Uint8Array}
 * @property secretKey {Uint8Array}
 */

/**
 * scrypt defaults
 * WARNING: changing scrypt params will break compatibility with older scrypt-generated data
 *
 * @type {Object}
 * @property {Number} N
 * @property {Number} r
 * @property {Number} dkLen
 * @property {Number} interruptStep
 */
const scryptOptions = {
    N: 16384,
    r: 8,
    dkLen: 64,
    interruptStep: 200
};


/**
 * Deterministically derives boot key and auth key pair.
 *
 * @param {String} username
 * @param {String} passphrase
 * @param {Uint8Array} salt
 */
exports.deriveAccountKeys = function(username, passphrase, salt) {
    const fullSalt = util.concatTypedArrays(util.strToBytes(username), salt);

    return this._deriveKeys(passphrase, fullSalt, 'PeerioPH')
        .then((derivedByteArray) => {
            const keys = {};
            try {
                keys.bootKey = new Uint8Array(derivedByteArray.slice(0, 32));
                const secretKey = new Uint8Array(derivedByteArray.slice(32, 64));
                keys.authKeyPair = nacl.box.keyPair.fromSecretKey(secretKey);
            } catch (ex) {
                return Promise.reject(err.normalize(ex, 'Scrypt callback exception.'));
            }
            return keys;
        });
};

/**
 * Derive keys for a ghost/ephemeral user.
 *
 * @param {String} id -- ghost ID
 * @param {String} passphrase
 * @returns {Promise<KeyPair>}
 */
exports.deriveEphemeralKeys = function(id, passphrase) {
    const ephemeralIDBytes = util.strToBytes(id);
    return this._deriveKeys(passphrase, ephemeralIDBytes, undefined, { dkLen: 32 })
        .then((keyBytes) => {
            return nacl.box.keyPair.fromSecretKey(new Uint8Array(keyBytes));
        });
};

/**
 * Derive keys -- agnostic.
 *
 * @param {String} passphraseString
 * @param {Uint8Array} saltBytes
 * @param {String} personalizationString [optional]
 * @param {Object} options [optional]
 * @returns {Promise<Array>}
 * @private
 */
exports._deriveKeys = function(passphraseString, saltBytes, personalizationString, options) {
    // overwrite any default properties
    const opts = options || {};
    _.defaults(opts, scryptOptions);
    return new Promise((resolve) => {
        const personalization = personalizationString ? {
            personalization: util.strToBytes(personalizationString)
        } : undefined;
        const prehashed = new BLAKE2s(32, personalization);
        prehashed.update(util.strToBytes(passphraseString));

        scrypt(prehashed.digest(), saltBytes, opts, (derivedBytes) => {
            resolve(derivedBytes);
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
