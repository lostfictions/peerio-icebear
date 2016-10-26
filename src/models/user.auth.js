/**
 * Authentication module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const publicCrypto = require('../crypto/public');
const socket = require('../network/socket');
const util = require('../util');
const Promise = require('bluebird');

module.exports = function mixUserAuthModule() {
    this._deriveKeys = () => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        if (!this.authSalt) return Promise.reject(new Error('Salt is required to derive keys'));

        return keys.deriveKeys(this.username, this.passphrase, this.authSalt)
                   .then(keySet => {
                       this.bootKey = keySet.bootKey;
                       this.authKeys = keySet.authKeyPair;
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

    this._authenticate = (data) => {
        console.log('Sending auth token back.');
        const decrypted = publicCrypto.decrypt(data.token, data.nonce, data.ephemeralServerPK, this.authKeys.secretKey);
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
};
