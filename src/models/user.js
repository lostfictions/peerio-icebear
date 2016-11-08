/**
 * @module models/user
 */
const Promise = require('bluebird');
const socket = require('../network/socket');
const mixUserRegisterModule = require('./user.register');
const mixUserAuthModule = require('./user.auth');
const KegDb = require('./kegs/keg-db');
const storage = require('../db/tiny-db');


let currentUser;
let lastAuthenticatedUser;

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
    _firstLoginInSession = true;

    get username() {
        return this._username;
    }

    set username(v) {
        this._username = typeof (v) === 'string' ? v.trim().toLowerCase() : '';
    }

    constructor() {
        this.createAccountAndLogin = this.createAccountAndLogin.bind(this);
        this.setReauthOnReconnect = this.setReauthOnReconnect.bind(this);
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
                       return this.kegdb.createBootKeg(this.bootKey, this.signKeys,
                           this.encryptionKeys, this.overrideKey);
                   })
                    .then(() => this._postAuth());
    }

    /**
     * Before login.
     *
     * @returns {*}
     * @private
     */
    _preAuth() {
        if (this._firstLoginInSession) {
            return this._checkForPasscode();
        }
        return Promise.resolve();
    }

    /**
     * Authenticates connection and makes necessary initial requests.
     */
    login() {
        console.log('Starting login sequence');
        return this._preAuth()
            .then(() => this._authenticateConnection())
            .then(() => this.kegdb.loadBootKeg(this.bootKey))
            .then(() => {
                // todo: doesn't look very good
                this.encryptionKeys = this.kegdb.boot.encryptionKeys;
                this.signKeys = this.kegdb.boot.signKeys;
            })
            .then(() => this._postAuth());
    }

    /**
     * Subscribe on events after auth
     *
     * @returns {Promise}
     */
    _postAuth() {
        socket.setAuthenticatedState();
        if (this._firstLoginInSession) {
            this._firstLoginInSession = false;
            this.setReauthOnReconnect();
            return User.setLastAuthenticated(this.username);
        }
        return Promise.resolve();
    }

    setReauthOnReconnect() {
        // only need to set reauth listener once
        if (this.stopReauthenticator) return;
        this.stopReauthenticator = socket.subscribe(socket.SOCKET_EVENTS.connect, this.login);
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

    /**
     * (Eventually) gets the username of the last authenticated user.
     *
     * @returns {Promise<String>}
     */
    static getLastAuthenticated() {
        return storage.get(`last_user_authenticated`)
            .then((obj) => {
                return obj.username;
            });
    }

    /**
     * Sets the username of the last authenticated user.
     *
     * @param {String} username
     * @returns {Promise}
     */
    static setLastAuthenticated(username) {
        return storage.set(`last_user_authenticated`, { username });
    }

    /**
     * (Eventually) removes the username of the last authenticated user.
     *
     * @returns {Promise<String>}
     */
    static removeLastAuthenticated() {
        return storage.remove(`last_user_authenticated`);
    }
}

module.exports = User;
