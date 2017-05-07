const socket = require('../../network/socket');
const { observable, action, when, computed, reaction } = require('mobx');
const { cryptoUtil } = require('../../crypto/index');
const { getUser } = require('./../../helpers/di-current-user');
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
    @observable encryptionPublicKey = null;
    @observable signingPublicKey = null;
    @observable tofuError = false;

    @computed get color() {
        if (!this.signingPublicKey) return '#9e9e9e';
        return `#${cryptoUtil.getHexHash(3, this.signingPublicKey)}`;
    }

    @computed get letter() {
        return String.fromCodePoint((this.firstName || this.username || ' ').codePointAt(0)).toUpperCase();
    }

    @computed get fullName() {
        let ret = '';
        if (this.firstName) ret = this.firstName;
        if (this.lastName) {
            if (ret) ret += ' ';
            ret += this.lastName;
        }
        return ret;
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

    // converts 12345-12345-12345-12345-12345 to
    //          1234 5123 4512\n3451 2345 1234 5123 45
    @computed get fingerprintSkylarFormatted() {
        let i = 0;
        return this.fingerprint
            .replace(/-/g, '')
            .match(/.{1,4}/g)
            .join(' ')
            .replace(/ /g, () => (i++ === 3 ? '\n' : ' '));
    }

    // contact wasn't found on server
    notFound = false;
    // to avoid parallel queries
    _waitingForResponse = false;

    /**
     * @param username
     * @param {[bool]} noAutoLoad - don't automatically call this.load() in constructor (needed for tests)
     */
    constructor(username, noAutoLoad) {
        this.username = username;
        if (getUser().username === username) this.isMe = true;
        if (this.isMe) {
            reaction(() => getUser().firstName, n => { this.firstName = n; });
            reaction(() => getUser().lastName, n => { this.lastName = n; });
        }
        if (!noAutoLoad) this.load();
    }

    load() {
        if (!this.loading || this._waitingForResponse) return;
        console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        this._waitingForResponse = true;

        socket.send('/auth/user/lookup', { string: this.username })
            .then(action(resp => {
                // currently there are old users in the system that don't have encryption public keys
                if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                    this.notFound = true;
                    this._waitingForResponse = false;
                    this.loading = false;
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
                }
                // eslint-disable-next-line consistent-return
                return this.loadTofu();
            }))
            .catch(err => {
                this._waitingForResponse = false;
                socket.onceAuthenticated(() => this.load());
                console.log(err);
            });
    }

    loadTofu() {
        return Tofu.getByUsername(this.username)
            .then(action(tofu => {
                this._waitingForResponse = false;
                this.loading = false;
                if (!tofu) {
                    const newTofu = new Tofu(getUser().kegDb);
                    newTofu.username = this.username;
                    newTofu.firstName = this.firstName;
                    newTofu.lastName = this.lastName;
                    newTofu.encryptionPublicKey = cryptoUtil.bytesToB64(this.encryptionPublicKey);
                    newTofu.signingPublicKey = cryptoUtil.bytesToB64(this.signingPublicKey);
                    // todo: this has a potential of creating 2+ tofu kegs for same contact
                    // todo: add checks similar to reciept keg dedupe
                    newTofu.saveToServer();
                    return;
                }
                // flagging contact
                if (tofu.encryptionPublicKey !== cryptoUtil.bytesToB64(this.encryptionPublicKey)
                    || tofu.signingPublicKey !== cryptoUtil.bytesToB64(this.signingPublicKey)) {
                    this.tofuError = true;
                }
                // overriding whatever server returned for contact with our stored keys
                // so crypto operations will fail in case of difference
                // todo: this works only until we implement key change feature
                this.encryptionPublicKey = cryptoUtil.b64ToBytes(tofu.encryptionPublicKey);
                this.signingPublicKey = cryptoUtil.b64ToBytes(tofu.signingPublicKey);
            }));
    }

    whenLoaded(callback) {
        // it is important for this to be async
        when(() => !this.loading, () => callback(this));
    }

    ensureLoaded() {
        return new Promise(resolve => {
            this.whenLoaded(resolve);
        });
    }

    static ensureAllLoaded(contacts) {
        return Promise.map(contacts, contact => contact.ensureLoaded());
    }
}

module.exports = Contact;
