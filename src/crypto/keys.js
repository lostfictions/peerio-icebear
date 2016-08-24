// @flow
/**
 * Peerio Crypto module for key handling.
 * @module crypto/keys
 */

const scrypt = require('scrypt-async');
const BLAKE2s = require('blake2s-js');
const nacl = require('tweetnacl');
const util = require('./util');

type KeyPairType = { publicKey: Uint8Array, secretKey: Uint8Array };

type MainKeySetType = {
    bootKey: Uint8Array,
    authKeyPair: KeyPairType
};

/**
 * Deterministically derives boot key and auth key pair.
 */
exports.deriveKeys = function (username: string, passphrase: string, salt: Uint8Array): Promise<MainKeySetType> {
    return new Promise((resolve: Function, reject: Function): void => {
        const prehashed = new BLAKE2s(32, { personalization: util.strToBytes('PeerioPH') });
        prehashed.update(util.strToBytes(passphrase));
        const fullSalt = util.concatBuffers(util.strToBytes(username), salt);

        // warning: changing scrypt params will break compatibility with older scrypt-generated data
        scrypt(prehashed.digest(), fullSalt, 14, 8, 64, 1000, (derivedBytes: Array<number>): void => {
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
 */
exports.generateSigningKeys = function (): KeyPairType {
    return nacl.sign.keyPair();
};
