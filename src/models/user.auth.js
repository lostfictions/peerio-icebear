/**
 * Authentication module for User model.
 *
 * @todo DeviceTokens
 * @todo local storage of authSalt
 * @module models/user
 */

const socket = require('../network/socket');
const { keys, publicCrypto, secret, cryptoUtil } = require('../crypto');
const util = require('../util');
const Promise = require('bluebird');
const errors = require('../errors');
const TinyDb = require('../db/tiny-db');

module.exports = function mixUserAuthModule() {
    /**
     * Authentication sequence.
     * @returns {Promise}
     * @private
     */
    this._authenticateConnection = () => {
        console.log('Starting connection auth sequence.');
        return this._loadAuthSalt()
                    .then(this._deriveKeys)
                    .then(this._getAuthToken)
                    .then(this._authenticateAuthToken);
    };

    /**
     * Derive the boot key and auth keypair from the passphrase and set them.
     *
     * @returns {Promise}
     * @private
     */
    this._deriveKeys = () => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        if (!this.authSalt) return Promise.reject(new Error('Salt is required to derive keys'));
        if (this.bootKey && this.authKeys) return Promise.resolve();
        return keys.deriveAccountKeys(this.username, this.passphrase, this.authSalt)
            .then(keySet => {
                this.bootKey = keySet.bootKey;
                this.authKeys = keySet.authKeyPair;
            });
    };

    /**
     * Get the authentication salt from the server if not stored locally.
     *
     * @todo store locally
     * @returns {Promise}
     * @private
     */
    this._loadAuthSalt = () => {
        console.log('Loading auth salt');
        if (this.authSalt) return Promise.resolve();
        return socket.send('/noauth/getAuthSalt', { username: this.username })
                     .then((response) => {
                         this.authSalt = new Uint8Array(response.authSalt);
                     });
    };

    /**
     * Get an authToken from the server.
     *
     * @returns {Promise}
     * @private
     */
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
    this._authenticateAuthToken = data => {
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
     * Checks storage for passcode.
     *
     * @returns {Promise}
     * @private
     */
    this._checkForPasscode = () => {
        return TinyDb.system.getValue(`${this.username}:passcode`)
            .then((passcodeSecretArray) => {
                if (passcodeSecretArray) {
                    return cryptoUtil.b64ToBytes(passcodeSecretArray);
                }
                return Promise.reject(new Error('no passcode found'));
            })
            .then((passcodeSecret) => {
                if (passcodeSecret) { // will be wiped after first login
                    return this._derivePassphraseFromPasscode(passcodeSecret);
                }
                return false;
            })
            .catch(err => {
                console.log(errors.normalize(err));
            });
    };

    /**
     * Derive a passphrase and set it for future authentications (only called if applicable on first login).
     * Won't throw if the passcode is incorrect -- login will proceed treating the same user input
     * as a passphrase instead of a passcode, allowing users who have a passcode set to still
     * use their passphrases.
     *
     * @param {Uint8Array} passcodeSecret
     * @returns {Promise}
     * @private
     */
    this._derivePassphraseFromPasscode = (passcodeSecret) => {
        console.log('Deriving passphrase from passcode.');
        return this._getAuthDataFromPasscode(this.passphrase, passcodeSecret)
            .then(passcodeData => {
                this.passphrase = passcodeData.passphrase;
            })
            .catch(() => {
                console.log('Deriving passphrase from passcode failed, ' +
                            'will ignore and retry login with passphrase');
            });
    };

    /**
     * Utility to get an object containing username, passphrase.
     **
     * @param {String} passcode
     * @param {Uint8Array} passcodeSecret
     * @returns {Object}
     */
    this._getAuthDataFromPasscode = (passcode, passcodeSecret) => {
        return keys.deriveKeyFromPasscode(this.username, passcode)
            .then(passcodeKey => secret.decryptString(passcodeSecret, passcodeKey))
            .then(authDataJSON => JSON.parse(authDataJSON));
    };

    /**
     * Checks if user has a passcode saved
     * @returns {Promise}
     */
    this.hasPasscode = () => {
        return TinyDb.system.getValue(`${this.username}:passcode`)
            .then(result => !!result);
    };

    /**
     * Given a passcode and a populated User model, gets a passcode-encrypted
     * secret containing the username and passphrase as a JSON string and stores
     * it to the local db.
     *
     * @param {String} passcode
     * @returns {Promise}
     */
    this.setPasscode = (passcode) => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        console.log('Setting passcode');
        return keys.deriveKeyFromPasscode(this.username, passcode)
            .then(passcodeKey => {
                return secret.encryptString(JSON.stringify({
                    username: this.username,
                    passphrase: this.passphrase
                }), passcodeKey);
            })
            .then(passcodeSecretU8 => {
                return TinyDb.system.setValue(`${this.username}:passcode`, cryptoUtil.bytesToB64(passcodeSecretU8));
            });
    };
};
