const socket = require('../network/socket');
const { observable, action, when, computed } = require('mobx');
const { cryptoUtil } = require('../crypto');
const { getUser } = require('./../helpers/di-current-user');
const Tofu = require('./tofu');
/**
 * Possible states and how to read them:
 * loading === true - trying to load contact, will make many attempts in case of connection issues
 * loading === false && notFound === false - success
 * loading === false && notFound === true  - fail due to inexisting contact
 */

const nullFingerprint = '00000-00000-00000-00000-00000-00000';

class Contact {
    // this flag means that we are making attempts to load contact
    // once it's 'false' it means that we are done trying with ether positive (notFound=false) result
    // or negative result.
    @observable loading = true; // default state, bcs that's what we do from the moment contact is created
    @observable firstName = '';
    @observable lastName = '';
    @observable encryptionPublicKey = '';
    @observable signingPublicKey = '';

    @computed get color() {
        if (!this.signingPublicKey) return '#9e9e9e';
        return `#${cryptoUtil.getHexHash(3, this.signingPublicKey)}`;
    }

    // fingerprint calculation is async, but at the same time we want it to be lazy computed
    // so we cache computed result here
    @observable __fingerprint = null;
    // but we also want to make sure computed will be refreshed on signing key change
    // so we remember which key was used
    __fingerprintKey;
    @computed get fingerprint() {
        if (!this.signingPublicKey) return nullFingerprint;
        if (!this.__fingerprint || this.__fingerprintKey !== this.signingPublicKey) {
            this.__fingerprintKey = this.signingPublicKey;
            cryptoUtil.getFingerprint(this.username, this.signingPublicKey)
                .then(f => { this.__fingerprint = f; });

            return nullFingerprint;
        }
        return this.__fingerprint;
    }
    // contact wasn't found on server
    notFound = false;
    // to avoid parallel queries
    _waitingForResponse = false;

    constructor(username) {
        this.username = username;
        if (getUser().username === username) this.isMe = true;
        this.load();
    }

    load() {
        if (!this.loading || this._waitingForResponse) return;
        console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        this._waitingForResponse = true;

        socket.send('/auth/lookupUser', { string: this.username })
            .then(action(resp => {
                  // currently there are old users in the system that don't have encryption public keys
                if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                    this.notFound = true;
                    return;
                }
                const profile = resp[0].profile;
                this.username = profile.username;
                this.firstName = profile.firstName || '';
                this.lastName = profile.lastName || '';
                  // this is server - controlled data, so we don't account for cases when it's invalid
                this.encryptionPublicKey = new Uint8Array(profile.encryptionPublicKey);
                this.signingPublicKey = new Uint8Array(profile.signingPublicKey);
                if (this.username === getUser().username) {
                    this._waitingForResponse = false;
                    this.loading = false;
                    return;
                }

                return Tofu.getByUsername(this.username) // eslint-disable-line consistent-return
                    .then(tofu => {
                        this._waitingForResponse = false;
                        this.loading = false;
                        if (!tofu) {
                            // todo create
                            const newTofu = new Tofu(getUser().kegDb);
                            newTofu.username = this.username;
                            newTofu.firstName = this.firstName;
                            newTofu.lastName = this.lastName;
                            newTofu.encryptionPublicKey = cryptoUtil.bytesToB64(this.encryptionPublicKey);
                            newTofu.signingPublicKey = cryptoUtil.bytesToB64(this.signingPublicKey);
                            // todo: this has a potential of creating 2+ tofu kegs for same contacts
                            // todo: in case of concurrency, but it's not a problem atm
                            // todo: and tofu is likely to be redesigned
                            newTofu.saveToServer();
                            return;
                        }
                        // overriding whatever server returned for contact with our stored keys
                        // so crypto operations will fail in case of difference
                        // todo: this works only until we implement key change feature
                        this.encryptionPublicKey = cryptoUtil.b64ToBytes(profile.encryptionPublicKey);
                        this.signingPublicKey = cryptoUtil.b64ToBytes(profile.signingPublicKey);
                    });
            }))
            .catch(err => {
                this._waitingForResponse = false;
                socket.onceAuthenticated(() => this.load());
                console.log(err);
            });
    }

    whenLoaded(callback) {
        // it is important for this to be async
        when(() => !this.loading, () => callback(this));
    }
}

module.exports = Contact;
