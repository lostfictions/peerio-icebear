// @flow
/**
 * Registration request model
 * @module models/RegistrationRequest
 */

const Promise = require('bluebird');
const socket = require('../network/socket');

class RegistrationRequest {
    authPublicKey: Uint8Array; // curve25519 public key
    signingPublicKey: Uint8Array; // ed25519 public key
    encryptionPublicKey: Uint8Array; // curve25519 public key
    authSalt: Uint8Array; // 32 bytes
    username: string; // chosen username
    firstName: string; // optional
    lastName: string; // optional
    locale: string = 'en';

    validateUsername(): Promise<bool> {
        return socket.send('/noauth/validateUsername', { username: this.username })
            .then((resp: Object) => !!resp && resp.available)
            .catch((err: any) => {
                console.error(err);
                return false;
            });
    }

    validate(): bool {
        try {
            if (!this.authPublicKey || !this.signingPublicKey ||
                !this.encryptionPublicKey || !this.authSalt || !this.username) return false;
            // todo: more validations
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }

    send(): Promise {
        // todo
    }

}

module.exports = RegistrationRequest;
