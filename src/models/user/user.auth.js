const socket = require('../../network/socket');
const { keys, publicCrypto, secret, cryptoUtil } = require('../../crypto/index');
const util = require('../../util');
const errors = require('../../errors');
const TinyDb = require('../../db/tiny-db');
const config = require('../../config');
const warnings = require('../warnings');
const clientApp = require('../client-app');
//
// Authentication mixin for User model.
// TODO: authentication code is a bit hard to read and follow, needs refactoring
//
module.exports = function mixUserAuthModule() {
    this._authenticateConnection = () => {
        console.log('Starting connection auth sequence.');
        return this._loadAuthSalt()
            .then(this._deriveKeys)
            .then(this._getAuthToken)
            .then(this._authenticateAuthToken)
            .catch(e => {
                // eslint-disable-next-line default-case
                switch (e.code) {
                    case errors.ServerError.codes.invalidDeviceToken:
                        console.log('Bad deviceToken, reauthenticating without one.');
                        return TinyDb.system.removeValue(`${this.username}:deviceToken`)
                            .then(this._authenticateConnection);
                    case errors.ServerError.codes.sdkVersionDeprecated:
                    case errors.ServerError.codes.clientVersionDeprecated:
                        warnings.addSevere('warning_deprecated');
                        clientApp.clientVersionDeprecated = true;
                        break;
                    case errors.ServerError.codes.twoFAAuthRequired:
                        console.log('Server requested 2fa on login.');
                        return this._handle2faOnLogin()
                            .catch(err => {
                                if (err && err.code === errors.ServerError.codes.invalid2FACode) {
                                    warnings.add('error_invalid2faCode');
                                    return Promise.resolve();
                                }
                                return Promise.reject(err);
                            })
                            .then(this._authenticateConnection);
                }
                return Promise.reject(e);
            })
            .then(() => {
                socket.preauthenticated = true;
            });
    };

    this._deriveKeys = () => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        if (!this.authSalt) return Promise.reject(new Error('Salt is required to derive keys'));
        if (this.bootKey && this.authKeys) return Promise.resolve();
        return keys.deriveAccountKeys(this.username, this.passphrase, this.authSalt)
            .then(keySet => {
                this.bootKey = keySet.bootKey;
                this.authKeys = keySet.authKeyPair;
            });
    };

    this._loadAuthSalt = () => {
        console.log('Loading auth salt');
        if (this.authSalt) return Promise.resolve();
        return socket.send('/noauth/auth-salt/get', { username: this.username })
            .then((response) => {
                this.authSalt = new Uint8Array(response.authSalt);
            });
    };
    this._getAuthToken = () => {
        console.log('Requesting auth token.');
        Promise.all([
            TinyDb.system.getValue(`${this.username}:deviceToken`) // for compatibility with older server
                .then(s => s ? cryptoUtil.b64ToBytes(s).buffer : undefined),
            this._getDeviceId(),
            this._get2faCookie()
        ]).then(([deviceToken, deviceId, twoFACookie]) => {
            const req = {
                username: this.username,
                authSalt: this.authSalt.buffer,
                authPublicKeyHash: keys.getAuthKeyHash(this.authKeys.publicKey).buffer,
                platform: config.platform,
                arch: config.arch,
                clientVersion: config.appVersion,
                sdkVersion: config.sdkVersion
            };
            if (deviceId) {
                req.deviceId = deviceId;
            }
            if (twoFACookie) {
                req.twoFACookie = twoFACookie;
            } else if (deviceToken) {
                req.deviceToken = deviceToken; // for compatibility with older server
            }
            return socket.send('/noauth/auth-token/get', req);
        })
            .then(resp => util.convertBuffers(resp));
    };

    this._authenticateAuthToken = data => {
        console.log('Sending auth token back.');
        const decrypted = publicCrypto.decryptCompat(data.token, data.nonce,
            data.ephemeralServerPK, this.authKeys.secretKey);
        // 65 84 = 'AT' (access token)
        if (decrypted[0] !== 65 || decrypted[1] !== 84 || decrypted.length !== 32) {
            return Promise.reject(new Error('Auth token plaintext is of invalid format.'));
        }
        return socket.send('/noauth/authenticate', {
            decryptedAuthToken: decrypted.buffer
        })
            .then(resp => {
                if (!resp.deviceToken) return undefined; // new server sends empty reponse
                // older server sends deviceToken, which we should remember
                return TinyDb.system.setValue(`${this.username}:deviceToken`,
                    cryptoUtil.bytesToB64(resp.deviceToken));
            });
    };

    this._checkForPasscode = (skipCache) => {
        if (!skipCache && this.authKeys) {
            console.log('user.auth.js: auth keys already loaded');
            return Promise.resolve(true);
        }
        return TinyDb.system.getValue(`${this.username}:passcode`)
            .then((passcodeSecretArray) => {
                if (passcodeSecretArray) {
                    return cryptoUtil.b64ToBytes(passcodeSecretArray);
                }
                return Promise.reject(new errors.NoPasscodeFoundError());
            })
            .then((passcodeSecret) => {
                this.passcodeIsSet = true;
                if (passcodeSecret) { // will be wiped after first login
                    return this._derivePassphraseFromPasscode(passcodeSecret);
                }
                return false;
            })
            .catch(err => {
                if (err && err.name === 'NoPasscodeFoundError') {
                    console.log(err.message);
                    return;
                }
                console.log(errors.normalize(err));
            });
    };

    //
    // Derive a passphrase and set it for future authentications (only called if applicable on first login).
    // Won't throw if the passcode is incorrect -- login will proceed treating the same user input
    // as a passphrase instead of a passcode, allowing users who have a passcode set to still
    // use their passphrases.
    //
    this._derivePassphraseFromPasscode = (passcodeSecret) => {
        console.log('Deriving passphrase from passcode.');
        return this._getAuthDataFromPasscode(this.passphrase, passcodeSecret)
            .then(this.deserializeAuthData)
            .catch(() => {
                console.log('Deriving passphrase from passcode failed, ' +
                    'will ignore and retry login with passphrase');
            });
    };

    this._getAuthDataFromPasscode = (passcode, passcodeSecret) => {
        return keys.deriveKeyFromPasscode(this.username, passcode)
            .then(passcodeKey => secret.decryptString(passcodeSecret, passcodeKey))
            .then(authDataJSON => JSON.parse(authDataJSON));
    };

    /**
     * Creates an object with key authentication data that can be used for login
     * with minimal time waste on key derivation.
     * You can use this to store auth data locally in keychain or protected with shorter password.
     * @returns {string}
     * @memberof User
     * @instance
     * @public
     */
    this.serializeAuthData = () => {
        const username = this.username;
        const paddedPassphrase = cryptoUtil.padPassphrase(this.passphrase);
        const authSalt = cryptoUtil.bytesToB64(this.authSalt);
        const bootKey = cryptoUtil.bytesToB64(this.bootKey);
        const secretKey = cryptoUtil.bytesToB64(this.authKeys.secretKey);
        const publicKey = cryptoUtil.bytesToB64(this.authKeys.publicKey);
        const data = JSON.stringify({
            username, paddedPassphrase, authSalt, bootKey, authKeys: { secretKey, publicKey }
        });
        return data;
    };
    /**
     * Applies serialized auth data to user object. Just call `login()` after this and user will get authenticated
     * faster then when you just provide username and passphrase.
     * @param {string} data
     * @memberof User
     * @instance
     * @public
     */
    this.deserializeAuthData = (data) => {
        // console.log(data);
        const { username, authSalt, bootKey, authKeys } = data;
        this.username = username;
        if (data.paddedPassphrase) {
            this.passphrase = cryptoUtil.unpadPassphrase(data.paddedPassphrase);
        } else {
            // Compatibility with old versions that didn't pad passhprase.
            this.passphrase = data.passphrase;
        }
        this.authSalt = authSalt && cryptoUtil.b64ToBytes(authSalt);
        this.bootKey = bootKey && cryptoUtil.b64ToBytes(bootKey);
        if (authKeys) {
            let { secretKey, publicKey } = authKeys;
            secretKey = secretKey && cryptoUtil.b64ToBytes(secretKey);
            publicKey = publicKey && cryptoUtil.b64ToBytes(publicKey);
            if (secretKey && publicKey) {
                this.authKeys = { secretKey, publicKey };
            }
        }
    };

    /**
     * Removes passcode for a user if it exists, and disables using passcodes.
     * @returns {Promise}
     * @memberof User
     * @instance
     * @public
     */
    this.disablePasscode = () => {
        return TinyDb.system.setValue(`${this.username}:passcode:disabled`, true)
            .then(() => {
                return TinyDb.system.removeValue(`${this.username}:passcode`)
                    .catch(err => {
                        if (err.message === 'Invalid tinydb key') {
                            return true;
                        }
                        return Promise.reject(err);
                    });
            });
    };

    /**
     * Checks if user disabled passcode.
     * @returns {Promise<boolean>}
     * @memberof User
     * @instance
     * @public
     */
    this.passcodeIsDisabled = () => {
        return TinyDb.system.getValue(`${this.username}:passcode:disabled`)
            .catch(() => false);
    };

    /**
     * Given a passcode and a populated User model, gets a passcode-encrypted
     * secret containing the username and passphrase as a JSON string and stores
     * it to the local db.
     * @param {string} passcode
     * @returns {Promise}
     * @memberof User
     * @instance
     * @public
     */
    this.setPasscode = (passcode) => {
        if (!this.username) return Promise.reject(new Error('Username is required to derive keys'));
        if (!this.passphrase) return Promise.reject(new Error('Passphrase is required to derive keys'));
        console.log('Setting passcode');
        return keys.deriveKeyFromPasscode(this.username, passcode)
            .then(passcodeKey => {
                return secret.encryptString(this.serializeAuthData(), passcodeKey);
            })
            .then(passcodeSecretU8 => {
                this.passcodeIsSet = true;
                return TinyDb.system.setValue(`${this.username}:passcode`, cryptoUtil.bytesToB64(passcodeSecretU8));
            })
            .then(() => {
                // if the user had previously disabled passcodes, remove the pref
                return TinyDb.system.removeValue(`${this.username}:passcode:disabled`)
                    .catch(err => {
                        if (err.message === 'Invalid tinydb key') {
                            return true;
                        }
                        return Promise.reject(err);
                    });
            });
    };

    /**
     * Validates passcode.
     * @param {string} passcode
     * @returns {Promise<boolean>}
     * @memberof User
     * @instance
     * @public
     */
    this.validatePasscode = (passcode) => {
        // creating temporary user obj to do that without affecting current instance's state
        const u = new this.constructor(); // eslint-disable-line
        u.passphrase = passcode;
        u.username = this.username;
        return u._checkForPasscode()
            .then(() => {
                return (u.passphrase && u.passphrase !== passcode)
                    ? u.passphrase
                    : Promise.reject(new Error('user.auth.js: passcode is not valid'));
            });
    };

    /**
     * Checks if user has a passcode saved.
     * @returns {Promise<boolean>}
     * @memberof User
     * @instance
     * @public
     */
    this.hasPasscode = () => {
        return TinyDb.system.getValue(`${this.username}:passcode`).then(result => !!result);
    };

    /**
     * Call from client app when user specifically chooses to signout.
     * This will positively effect 2fa security.
     *
     * @param {boolean} untrust if true, no longer trust the device
     */
    this.signout = (untrust = false) => {
        return this._getDeviceTrust(trusted => {
            // On untrusted devices, during logout we remove
            // the 2fa cookie, so that the next sign in will
            // require 2fa.
            //
            // On trusted devices, we preserve the cookie,
            // thus users won't be asked for 2fa code again.
            if (!trusted || untrust) {
                return this._delete2faCookie()
                    .then(() => this._setDeviceTrust(false));
            }
            return undefined; // eslint-ok-you-win
        })
            .catch(err => {
                // Failed to delete cookie, just log error
                // and continue with server call. If server
                // call succeeds, it will remove its copy of
                // the cookie, invalidating ours.
                console.error(err);
            })
            .then(() =>
                socket.send('/auth/signout')
                    .timeout(3000)
                    .catch(err => {
                        // Not a show stopper.
                        // If on untrusted device we removed our 2fa cookie
                        // successfully, it will invalidate 2fa session,
                        // so that the next sign it will require 2fa even
                        // if server still has the cookie.
                        //
                        // If both cookie removal and server call failed,
                        // the user won't be asked for 2fa code during the
                        // next sign it even on untrusted device.
                        // But that's the best we could do.
                        console.error(err);
                    })
            );
    };
};
