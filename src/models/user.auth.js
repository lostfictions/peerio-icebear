/**
 * Authentication module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const publicCrypto = require('../crypto/public');
const socket = require('../network/socket');
const util = require('../util');
const Promise = require('bluebird');

module.exports = {

    initAuthModule() {
        this._getAuthToken = this._getAuthToken.bind(this);
        this._loadAuthSalt = this._loadAuthSalt.bind(this);
        this._authenticate = this._authenticate.bind(this);
    },

    // @param intial - on first login we don't want auth events,
    //                 beacause we have keg initialization to do before app can start.
    login(initial?: boolean): Promise<void> {
        console.log('Starting login sequence.');
        return this._loadAuthSalt().then(this.deriveKeys).then(this._getAuthToken).then(this._authenticate);
    },

    _loadAuthSalt(): Promise<void> {
        console.log('Loading auth salt');
        return socket.send('/noauth/getAuthSalt', { username: this.username })
                     .then((response: Object) => {
                         this.authSalt = new Uint8Array(response.authSalt);
                         return;
                     });
    },

    _getAuthToken(): Promise<Object> {
        console.log('Requesting auth token.');
        return socket.send('/noauth/getAuthToken', {
            username: this.username,
            authSalt: this.authSalt.buffer,
            authPublicKeyHash: keys.getAuthKeyHash(this.authKeys.publicKey).buffer
        })
        .then(resp => util.convertBuffers(resp));
    },

    _authenticate(data: Object): Promise<void> {
        console.log('Sending auth token back.');
        const decrypted = publicCrypto.decrypt(data.token, data.nonce, data.ephemeralServerPK, this.authKeys.secretKey);
        if (decrypted[0] !== 65 || decrypted[1] !== 84 || decrypted.length !== 32) {
            return Promise.reject(new Error('Auth token paintext is of invalid format.'));
        }
        return socket.send('/noauth/authenticate', {
            decryptedAuthToken: decrypted.buffer,
            platform: 'browser', // todo: set platform
            clientVersion: '1.0.0' // todo: set version
        });
    }

};
