/**
 * @module models/user
 */
const Promise = require('bluebird');
const socket = require('../network/socket');
const mixUserRegisterModule = require('./user.register');
const mixUserAuthModule = require('./user.auth');
const KegDb = require('./kegs/keg-db');

let currentUser;

class User {

    _username;

    firstName;
    lastName;
    email;
    locale = 'en';
    passphrase;
    authSalt;
    bootKey;
    authKeys;
    signKeys;
    encryptionKeys;
    kegKey;

    get username() {
        return this._username;
    }

    set username(v) {
        this._username = typeof (v) === 'string' ? v.trim().toLowerCase() : '';
    }

    constructor() {
        this.login = this.login.bind(this);
        // this is not really extending prototype, but we don't care because User is almost a singleton
        // (new instance created on every initial login attempt only)
        mixUserAuthModule.call(this);
        mixUserRegisterModule.call(this);
        this.kegdb = new KegDb('SELF');
    }

    /**
     * Full registration process.
     * Initial login after registration differs a little.
     * @returns {Promise}
     */
    createAccountAndLogin() {
        console.log('Starting account registration sequence.');
        return this._createAccount()
                   .then(() => this._authenticateConnection())
                   .then(() => {
                       console.log('Creating boot keg.');
                       const payload = {
                           signKeys: this.signKeys,
                           encryptionKeys: this.encryptionKeys,
                           kegKey: this.kegKey
                       };

                       return this.kegdb.createBootKeg(this.bootKey, payload);
                   })
                    .then(() => this.setReauthOnReconnect());
    }

    /**
     * Authenticates connection and makes necessary initial requests.
     */
    login() {
        console.log('Starting login sequence');
        return this._authenticateConnection()
                    .then(() => this.kegdb.loadBootKeg(this.bootKey))
                    .then(() => this.setReauthOnReconnect());
    }

    setReauthOnReconnect() {
        if (!this.reconnector) {
            this.reconnector = socket.subscribe(socket.SOCKET_EVENTS.connect, this.login);
        }
    }

    static validateUsername(username) {
        if (typeof (username) === 'string' && username.trim().length === 0) return Promise.resolve(false);
        return socket.send('/noauth/validateUsername', { username })
            .then(resp => !!resp && resp.available)
            .catch(err => {
                console.error(err);
                return false;
            });
    }

    static get current() {
        return currentUser;
    }

    static set current(val) {
        currentUser = val;
    }
}

module.exports = User;
