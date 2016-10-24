/**
 * @module models/user
 */

const keys = require('../crypto/keys');
const secret = require('../crypto/secret');
const util = require('../crypto/util');
const Promise = require('bluebird');
const socket = require('../network/socket');
const UserRegister = require('./user.register');
const UserAuth = require('./user.auth');
const UserPasscode = require('./user.passcode');
const errors = require('../errors');
const KegClient = require('../network/keg-client');
const tweetnacl = require('tweetnacl');

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
        this.kegdb = new KegClient('SELF');
        this.initAuthModule();
        this.initRegisterModule();
        this.deriveKeys = this.deriveKeys.bind(this);
    }

    deriveKeys() {
        try {
            if (!this.username) throw new Error('Username is required to derive keys');
            if (!this.passphrase) throw new Error('Passphrase is required to derive keys');
            if (!this.authSalt) throw new Error('Salt is required to derive keys');
        } catch (e) {
            return Promise.reject(errors.normalize(e));
        }

        return keys.deriveKeys(this.username, this.passphrase, this.authSalt)
                   .then((keySet) => {
                       this.bootKey = keySet.bootKey;
                       this.authKeys = keySet.authKeyPair;
                   });
    }

    // full workflow
    createAccountAndLogin() {
        console.log('Starting account registration sequence.');
        return this._createAccount()
                   .then(() => this.login(true))
                   .then(() => {
                       console.log('Creating boot keg.');
                       let payload = {
                           signKeys: this.signKeys,
                           encryptionKeys: this.encryptionKeys,
                           kegKey: this.kegKey,
                           kegKeyId: '0'
                       };
                       payload.signKeys.publicKey = util.bytesToStr(payload.signKeys.publicKey);
                       payload.signKeys.secretKey = util.bytesToStr(payload.signKeys.secretKey);
                       payload.encryptionKeys.publicKey = util.bytesToStr(payload.encryptionKeys.publicKey);
                       payload.encryptionKeys.secretKey = util.bytesToStr(payload.encryptionKeys.secretKey);
                       payload.kegKey = util.bytesToStr(payload.kegKey);
                       payload = secret.encryptString(JSON.stringify(payload), this.bootKey);
                       return this.kegdb.update('boot', 'boot', 2, payload);
                   });
    }

    static validateUsername(username) {
        if (typeof (username) === 'string' && username.trim().length === 0) return Promise.resolve(false);
        return socket.send('/noauth/validateUsername', { username })
            .then(resp => !!resp && resp.available)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }
}

Object.assign(User.prototype, UserRegister);
Object.assign(User.prototype, UserAuth);
Object.assign(User.prototype, UserPasscode);

module.exports = User;
