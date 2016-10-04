// @flow
/**
 * Base user class containing class properties mostly
 * @module models/user
 */

class UserBase {

    _username: string;

    firstName: string;
    lastName: string;
    locale: string = 'en';
    passphrase: string;
    salt: Uint8Array;
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

}

module.exports = UserBase;
