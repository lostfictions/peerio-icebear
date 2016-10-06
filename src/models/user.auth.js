// @flow
/**
 * Authentication module for User model.
 * @module models/user
 */

const mixin = require('../mixwith').Mixin;
const keys = require('../crypto/keys');
const publicCrypto = require('../crypto/public');
// const signCrypto = require('../crypto/sign');
const socket = require('../network/socket');
const util = require('../util');
const Promise = require('bluebird');

module.exports = mixin(userClass => class extends userClass {

    constructor() {
        super();
        this._loadAuthSalt = this._loadAuthSalt.bind(this);
        this._getAuthToken = this._getAuthToken.bind(this);
        this._authenticate = this._authenticate.bind(this);
    }

    login(): Promise<void> {
        return this._loadAuthSalt().then(this._getAuthToken).then(this._authenticate);
    }

    _loadAuthSalt(): Promise<void> {
        return socket.send('/noauth/getAuthSalt', { username: this.username })
                     .then((response: Object) => {
                         this.authSalt = new Uint8Array(response.authSalt);
                         return;
                     });
    }

    _getAuthToken(): Promise<Object> {
        return socket.send('/noauth/getAuthToken', {
            username: this.username,
            authSalt: this.authSalt.buffer,
            authPublicKeyHash: keys.getAuthKeyHash(this.authKeys.publicKey).buffer
        })
        .then(resp => util.convertBuffers(resp));
    }

    _authenticate(data: Object): Promise<void> {
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

});
