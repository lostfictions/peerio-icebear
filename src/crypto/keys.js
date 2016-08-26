// @flow
/**
 * Peerio Crypto module for key handling.
 * @module crypto/keys
 */

const scrypt = require('scrypt-async');
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');

/** Standard key pair in binary format. */
type KeyPairType = { publicKey: Uint8Array, secretKey: Uint8Array };

/**
 * Main and minimal Peerio user's key set.
 * This is required to authenticate and start working, get other keys, etc.
 */
type MainKeySetType = {
    bootKey: Uint8Array,
    authKeyPair: KeyPairType
};

/**
 * Deterministically derives boot key and auth key pair.
 */
exports.deriveKeys = function(username: string, passphrase: string, salt: Uint8Array): Promise<MainKeySetType> {
    return new Promise((resolve: Function, reject: Function): void => {
        const prehashed = new BLAKE2s(32, { personalization: util.strToBytes('PeerioPH') });
        prehashed.update(util.strToBytes(passphrase));
        const fullSalt = util.concatTypedArrays(util.strToBytes(username), salt);

        // warning: changing scrypt params will break compatibility with older scrypt-generated data
        // params: password, salt, resource cost, block size, key length, async interrupt step (ms.)
        scrypt(prehashed.digest(), fullSalt, 14, 8, 64, 300, (derivedBytes: Array<number>): void => {
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
};

/**
 * Generates new random signing (ed25519) key pair.
 * 32 byte public key and 64 byte secret key.
 */
exports.generateSigningKeyPair = function(): KeyPairType {
    return nacl.sign.keyPair();
};

/**
 * Generates new random asymmetric (curve25519) key pair.
 */
exports.generateEncryptionKeyPair = function(): KeyPairType {
    return nacl.box.keyPair();
};

/**
 * Generates new random symmetric (xsalsa20) 32 byte secret key.
 */
exports.generateEncryptionKey = function(): Uint8Array {
    return nacl.randomBytes(32);
};
