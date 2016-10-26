/**
 * Passcode module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const secret = require('../crypto/secret');
const errors = require('../errors');
const Promise = require('bluebird');

module.exports = {
    /**
     * Given a passcode and a populated User model, gets a passcode-encrypted
     * secret containing the username and passphrase as a JSON string.
     *
     * @param passcode
     * @returns {Promise}
     */
    getPasscodeSecret(passcode) {
        try {
            if (!this.username) throw new Error('Username is required to derive keys');
            if (!this.passphrase) throw new Error('Passphrase is required to derive keys');
        } catch (e) {
            return Promise.reject(errors.normalize(e));
        }

        return keys.deriveKeyFromPasscode(passcode)
            .then((passcodeKey) => {
                return secret.encryptString(JSON.stringify({
                    username: this.username,
                    passphrase: this.passphrase
                }), passcodeKey);
            });
    },
    /**
     * Utility to get an object containing username, passphrase.
     *
     * @todo implement a login method that uses passcode and make this private
     *
     * @param passcode
     * @param passcodeSecret
     */
    getAuthDataFromPasscode(passcode, passcodeSecret) {
        return keys.deriveKeyFromPasscode(passcode)
            .then((passcodeKey) => {
                return secret.decryptString(passcodeSecret, passcodeKey);
            })
            .then((authDataJSON) => {
                return JSON.parse(authDataJSON);
            });
    }
};
