/**
 * @module models/user
 */

const keys = require('../crypto/keys');
const Promise = require('bluebird');
const socket = require('../network/socket');
const UserRegister = require('./user.register');
const UserAuth = require('./user.auth');
const errors = require('../errors');

class User {

    _username: string;

    firstName: string;
    lastName: string;
    locale: string = 'en';
    passphrase: string;
    authSalt: Uint8Array;
    bootKey: Uint8Array;
    authKeys: KeyPair;
    signKeys: KeyPair;
    encryptionKeys: KeyPair;
    kegKey: Uint8Array;

    get username(): string {
        return this._username;
    }

    set username(v: string) {
        this._username = typeof (v) === 'string' ? v.trim().toLowerCase() : '';
    }

    constructor() {
        this.initAuthModule();
        this.initRegisterModule();
        this.deriveKeys = this.deriveKeys.bind(this);
    }

    deriveKeys(): Promise {
        try {
            if (!this.username) throw new Error('Username is required to derive keys');
            if (!this.passphrase) throw new Error('Passphrase is required to derive keys');
            if (!this.authSalt) throw new Error('Salt is required to derive keys');
        } catch (e) {
            return Promise.reject(errors.normalize(e));
        }

        return keys.deriveKeys(this.username, this.passphrase, this.authSalt)
                   .then((keySet: MainKeySet) => {
                       this.bootKey = keySet.bootKey;
                       this.authKeys = keySet.authKeyPair;
                   });
    }

    static validateUsername(username: string): Promise<bool> {
        return socket.send('/noauth/validateUsername', { username })
            .then(resp => !!resp && resp.available)
            .catch((err: Error) => {
                console.error(err);
                return false;
            });
    }
}

Object.assign(User.prototype, UserRegister);
Object.assign(User.prototype, UserAuth);

module.exports = User;
