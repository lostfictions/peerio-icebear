/**
 * Authentication module for User model.
 * @module models/user
 */

const keys = require('../crypto/keys');
const publicCrypto = require('../crypto/public');
const socket = require('../network/socket');
const util = require('../util');
const Promise = require('bluebird');

var keySize = 32;
// DO NOT CHANGE, it will change crypto output
var scryptResourceCost = 14;
var scryptBlockSize = 8;
var scryptStepDuration = 1000;

module.exports = {

    initAuthModule() {
        this._getAuthToken = this._getAuthToken.bind(this);
        this._loadAuthSalt = this._loadAuthSalt.bind(this);
        this._authenticate = this._authenticate.bind(this);
    },

    // @param intial - on first login we don't want auth events,
    //                 beacause we have keg initialization to do before app can start.
    login(initial) {
        console.log('Starting login sequence.');
        return this._loadAuthSalt().then(this.deriveKeys).then(this._getAuthToken).then(this._authenticate);
    },
    

    _loadAuthSalt() {
        console.log('Loading auth salt');
        return socket.send('/noauth/getAuthSalt', { username: this.username })
                     .then((response) => {
                         this.authSalt = new Uint8Array(response.authSalt);
                         return;
                     });
    },

    _getAuthToken() {
        console.log('Requesting auth token.');
        return socket.send('/noauth/getAuthToken', {
            username: this.username,
            authSalt: this.authSalt.buffer,
            authPublicKeyHash: keys.getAuthKeyHash(this.authKeys.publicKey).buffer
        })
        .then(resp => util.convertBuffers(resp));
    },

    /**
     * Decrypt authToken, verify its format and send it back to the server.
     *
     * @param data
     * @returns {*}
     * @private
     */
    _authenticate(data) {
        console.log('Sending auth token back.');
        const decrypted = publicCrypto.decrypt(data.token, data.nonce, data.ephemeralServerPK, this.authKeys.secretKey);
        if (decrypted[0] !== 65 || decrypted[1] !== 84 || decrypted.length !== 32) {
            return Promise.reject(new Error('Auth token plaintext is of invalid format.'));
        }
        return socket.send('/noauth/authenticate', {
            decryptedAuthToken: decrypted.buffer,
            platform: 'browser', // todo: set platform
            clientVersion: '1.0.0' // todo: set version
        });
    }

};
