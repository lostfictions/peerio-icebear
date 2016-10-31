/**
 * Authentication module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const publicCrypto = require('../crypto/public');
const secret = require('../crypto/secret');
const socket = require('../network/socket');
const util = require('../util');
const Promise = require('bluebird');
const errors = require('../errors');

module.exports = function mixUserAuthModule() {
    this._deriveKeys = () => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        if (!this.authSalt) return Promise.reject(new Error('Salt is required to derive keys'));

        if (this.passcodeSecret) {
            return this._derivePassphraseFromPasscode();
        }
        return this._deriveKeysFromPassphrase();
    };

    this._deriveKeysFromPassphrase = () => {
        return keys.deriveKeys(this.username, this.passphrase, this.authSalt)
            .then(keySet => {
                this.bootKey = keySet.bootKey;
                this.authKeys = keySet.authKeyPair;
            });
    };

    this._derivePassphraseFromPasscode = () => {
        return this._getAuthDataFromPasscode(this.passphrase, this.passcodeSecret)
            .then((passcodeData) => {
                console.log('Derived passphrase from passcode.');
                this.passphrase = passcodeData.passphrase;
                return this._deriveKeysFromPassphrase();
            });
    };

    this._authenticateConnection = () => {
        console.log('Starting connection auth sequence.');
        return this._loadAuthSalt()
                    .then(this._deriveKeys)
                    .then(this._getAuthToken)
                    .then(this._authenticate);
    };

    this._loadAuthSalt = () => {
        console.log('Loading auth salt');
        if (this.authSalt) return Promise.resolve();
        return socket.send('/noauth/getAuthSalt', { username: this.username })
                     .then((response) => {
                         this.authSalt = new Uint8Array(response.authSalt);
                     });
    };

    this._getAuthToken = () => {
        console.log('Requesting auth token.');
        return socket.send('/noauth/getAuthToken', {
            username: this.username,
            authSalt: this.authSalt.buffer,
            authPublicKeyHash: keys.getAuthKeyHash(this.authKeys.publicKey).buffer
        })
        .then(resp => util.convertBuffers(resp));
    };

    /**
     * Decrypt authToken, verify its format and send it back to the server.
     * @param data
     * @returns {*}
     * @private
     */
    this._authenticate = data => {
        console.log('Sending auth token back.');
        const decrypted = publicCrypto.decryptCompat(data.token, data.nonce,
                                                            data.ephemeralServerPK, this.authKeys.secretKey);
        // 65 84 = 'AT' (access token)
        if (decrypted[0] !== 65 || decrypted[1] !== 84 || decrypted.length !== 32) {
            return Promise.reject(new Error('Auth token plaintext is of invalid format.'));
        }
        return socket.send('/noauth/authenticate', {
            decryptedAuthToken: decrypted.buffer,
            platform: 'browser', // todo: set platform
            clientVersion: '1.0.0' // todo: set version
        });
    };

    /**
     * Given a passcode and a populated User model, gets a passcode-encrypted
     * secret containing the username and passphrase as a JSON string.
     * @param passcode
     * @returns {Promise}
     */
    this.getPasscodeSecret = passcode => {
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
    };

    /**
     * Utility to get an object containing username, passphrase.
     *
     * @todo implement a login method that uses passcode and make this private
     *
     * @param passcode
     * @param passcodeSecret
     */
    this._getAuthDataFromPasscode = (passcode, passcodeSecret) => {
        return keys.deriveKeyFromPasscode(passcode)
            .then(passcodeKey => secret.decryptString(passcodeSecret, passcodeKey))
            .then(authDataJSON => JSON.parse(authDataJSON));
    };
};
