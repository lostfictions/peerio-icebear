/**
 * @module models/user
 */

const keys = require('../crypto/keys');
const Promise = require('bluebird');
const socket = require('../network/socket');
const mix = require('mixwith').mix;
const UserBase = require('./user-base');
const UserRegister = require('./user.register');
const UserAuth = require('./user.auth');
const errors = require('../errors');

class User extends mix(UserBase).with(UserRegister, UserAuth) {

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


    static validateUsername(username): Promise<bool> {
        return socket.send('/noauth/validateUsername', { username })
            .then(resp => !!resp && resp.available)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }
}

module.exports = User;
