/**
 * Authentication module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const secret = require('../crypto/secret');
const util = require('../util');
const BLAKE2s = require('blake2s-js');
const scrypt = require('scrypt-async');
const Promise = require('bluebird');

var keySize = 32;
// DO NOT CHANGE, it will change crypto output
var scryptResourceCost = 14;
var scryptBlockSize = 8;
var scryptStepDuration = 1000;

module.exports = {

    getPasscodeSecret(passcode) {
        try {
            if (!this.username) throw new Error('Username is required to derive keys');
            if (!this.passphrase) throw new Error('Passphrase is required to derive keys');
            if (!this.authSalt) throw new Error('Salt is required to derive keys');
        } catch (e) {
            return Promise.reject(errors.normalize(e));
        }

        return this._deriveKeyFromPasscode(passcode)
            .then((passcodeKey) => {
                return secret.encrypt({}, passcodeKey);
            })
    },

    /**
     *
     *
     * @param passcode {String}
     * @returns {Promise<Uint8Array>}
     */
    _deriveKeyFromPasscode(passcode) {
        return new Promise((resolve) => {
            var hash = new BLAKE2s(keySize);
            hash.update(decodeUTF8(passcode));
            scrypt(hash.hexDigest(), decodeUTF8(this.username), scryptResourceCost, scryptBlockSize,
                keySize, scryptStepDuration, resolve);
        }).then((keyBytes) => {
            return new Uint8Array(keyBytes);
        });
    },

};
