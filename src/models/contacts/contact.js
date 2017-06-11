
const socket = require('../../network/socket');
const { observable, action, when, computed, reaction } = require('mobx');
const { cryptoUtil } = require('../../crypto/index');
const { getUser } = require('./../../helpers/di-current-user');
const Tofu = require('./tofu');
const { getFirstLetterUpperCase } = require('./../../helpers/string');
const serverSettings = require('../server-settings');
const { t } = require('peerio-translator');

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
    username;
    usernameTag;
    @observable firstName = '';
    @observable lastName = '';
    @observable encryptionPublicKey = null;
    @observable signingPublicKey = null;
    @observable tofuError = false;
    @observable isAdded = false; // wether or not user added this contact to his address book
    @observable urlSalt = null;
    @observable profileVersion = 0;
    @observable hasAvatar = false;

    @computed get color() {
        if (!this.signingPublicKey) return '#9e9e9e';
        return `#${cryptoUtil.getHexHash(3, this.signingPublicKey)}`;
    }

    @computed get letter() {
        return getFirstLetterUpperCase(this.firstName || this.username);
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
    @computed get fullNameLower() {
        return this.fullName.toLocaleLowerCase();
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

    @computed get _avatarUrl() {
        return `${serverSettings.avatarServer}/v2/avatar/${this.urlSalt}`;
    }
    @computed get largeAvatarUrl() {
        if (!this.hasAvatar) return null;
        return `${this._avatarUrl}/large/?${this.profileVersion}`;
    }
    @computed get mediumAvatarUrl() {
        if (!this.hasAvatar) return null;
        return `${this._avatarUrl}/medium/?${this.profileVersion}`;
    }

    // converts 12345-12345-12345-12345-12345 to
    //          1234 5123 4512\n3451 2345 1234 5123 45
    @computed get fingerprintSkylarFormatted() {
        let i = 0;
        return this.fingerprint
            .replace(/-/g, '')
            .match(/.{1,5}/g)
            .join(' ')
            .replace(/ /g, () => (i++ === 2 ? '\n' : ' '));
    }

    // contact wasn't found on server
    notFound = false;
    // to avoid parallel queries
    _waitingForResponse = false;

    /**
     * @param username - this can also be an email which will be replaced with username if user found
     * @param {[bool]} noAutoLoad - don't automatically call this.load() in constructor (needed for tests)
     */
    constructor(username, noAutoLoad, prefetchedData) {
        this.username = username.toLowerCase();
        if (getUser().username === this.username) this.isMe = true;
        this.usernameTag = `@${this.username}`;
        if (this.isMe) {
            this.usernameTag += ` (${t('title_you')})`;
            reaction(() => getUser().firstName, n => { this.firstName = n; });
            reaction(() => getUser().lastName, n => { this.lastName = n; });
        }
        if (!noAutoLoad) this.load(prefetchedData);
    }

    load(prefetchedData) {
        if (!this.loading || this._waitingForResponse) return;
        console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        this._waitingForResponse = true;

        (
            prefetchedData
                ? Promise.resolve(prefetchedData)
                : socket.send('/auth/user/lookup', { string: this.username })
        )
            .then(action(resp => {
                // currently there are old users in the system that don't have encryption public keys
                if (!resp || !resp.length || !resp[0].length || !resp[0][0].profile.encryptionPublicKey) {
                    this.notFound = true;
                    this._waitingForResponse = false;
                    this.loading = false;
                    return;
                }
                const profile = resp[0][0].profile;
                this.username = profile.username;
                this.firstName = profile.firstName || '';
                this.lastName = profile.lastName || '';
                this.urlSalt = profile.urlSalt;
                this.hasAvatar = profile.hasAvatar;
                this.mentionRegex = new RegExp(`@${this.username}`, 'gi');

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
                if (!prefetchedData) socket.onceAuthenticated(() => this.load());
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
