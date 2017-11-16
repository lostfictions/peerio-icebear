'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _class2, _temp;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

const socket = require('../../network/socket');
const { observable, action, when, computed, reaction } = require('mobx');
const { cryptoUtil } = require('../../crypto/index');
const { getUser } = require('./../../helpers/di-current-user');
const Tofu = require('./tofu');
const { getFirstLetterUpperCase } = require('./../../helpers/string');
const serverSettings = require('../server-settings');
const { t } = require('peerio-translator');
const clientApp = require('../client-app');
const { getContactStore } = require('../../helpers/di-contact-store');

const nullFingerprint = '00000-00000-00000-00000-00000-00000';

/**
 * Contact object represents any Peerio user, including currently authenticated user.
 *
 * Possible states and how to read them:
 * loading === true - trying to load contact, will make many attempts in case of connection issues
 * loading === false && notFound === false - success
 * loading === false && notFound === true  - fail
 * @param {string} username - this can also be an email which will be replaced with username if user found
 * @param {Object} [prefetchedData] - if, for some reason you have the contact data from server, feed it here
 * @param {bool} [noAutoLoad] - don't automatically call this.load() in constructor (needed for tests only)
 * @public
 */
let Contact = (_class = (_temp = _class2 = class Contact {
    constructor(username, prefetchedData, noAutoLoad) {
        _initDefineProp(this, 'loading', _descriptor, this);

        _initDefineProp(this, 'firstName', _descriptor2, this);

        _initDefineProp(this, 'lastName', _descriptor3, this);

        _initDefineProp(this, 'encryptionPublicKey', _descriptor4, this);

        _initDefineProp(this, 'signingPublicKey', _descriptor5, this);

        _initDefineProp(this, 'tofuError', _descriptor6, this);

        _initDefineProp(this, 'isAdded', _descriptor7, this);

        _initDefineProp(this, 'urlSalt', _descriptor8, this);

        _initDefineProp(this, 'profileVersion', _descriptor9, this);

        _initDefineProp(this, 'hasAvatar', _descriptor10, this);

        _initDefineProp(this, 'isDeleted', _descriptor11, this);

        _initDefineProp(this, '__fingerprint', _descriptor12, this);

        this.notFound = false;
        this.isLegacy = false;
        this._waitingForResponse = false;

        this.username = username.toLowerCase();
        if (getUser().username === this.username) this.isMe = true;
        this.usernameTag = `@${this.username}`;
        if (this.isMe) {
            this.usernameTag += ` (${t('title_you')})`;
            reaction(() => getUser().firstName, n => {
                this.firstName = n;
            });
            reaction(() => getUser().lastName, n => {
                this.lastName = n;
            });
        }
        if (!noAutoLoad) this.load(prefetchedData);
    }

    /**
     * This flag means that we are making attempts to load contact
     * once it's 'false' it means that we are done trying with ether positive (notFound=false) result
     * or negative result. It's set to true by default, right after it exits constructor.
     * @memberof Contact
     * @member {boolean} loading
     * @instance
     * @public
     */
    // default state, because that's what we do from the moment contact is created
    /**
     * @member {string}
     * @public
     */

    /**
     * '@username'
     * @member {string}
     * @public
     */

    /**
     * @memberof Contact
     * @member {string} firstName
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {string} lastName
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {Uint8Array} encryptionPublicKey
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {Uint8Array} signingPublicKey
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {boolean} tofuError
     * @instance
     * @public
     */

    /**
     * Wether or not user added this contact to his address book
     * @memberof Contact
     * @member {boolean} isAdded
     * @instance
     * @public
     */

    /**
     * Some server-generated random chars to prevent enumeration of user-specific urls
     * @memberof Contact
     * @member {string} urlSalt
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {boolean} profileVersion
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {boolean} hasAvatar
     * @instance
     * @public
     */

    /**
     * @memberof Contact
     * @member {boolean} isDeleted
     * @instance
     * @public
     */


    /**
     * RGB string built based on hashed signing public key, not cryptographically strong, just for better UX
     * @memberof Contact
     * @member {string} color
     * @instance
     * @public
     */
    get color() {
        if (!this.signingPublicKey) return '#9e9e9e';
        return `#${cryptoUtil.getHexHash(3, this.signingPublicKey)}`;
    }

    /**
     * First letter of first name or username.
     * @memberof Contact
     * @member {string} letter
     * @instance
     * @public
     */
    get letter() {
        return getFirstLetterUpperCase(this.firstName || this.username);
    }

    /**
     * @memberof Contact
     * @member {string} fullName
     * @instance
     * @public
     */
    get fullName() {
        let ret = '';
        if (this.firstName) ret = this.firstName;
        if (this.lastName) {
            if (ret) ret += ' ';
            ret += this.lastName;
        }
        return ret;
    }

    /**
     * @memberof Contact
     * @member {string} fullNameAndUsername
     * @instance
     * @public
     */
    get fullNameAndUsername() {
        let ret = '';
        if (this.firstName) ret = this.firstName;
        if (this.lastName) {
            if (ret) ret += ' ';
            ret += this.lastName;
        }
        if (ret) ret += ' ';
        ret += `(${this.username})`;
        return ret;
    }

    /**
     * Lower cased full name for search/filter optimization
     * @memberof Contact
     * @member {string} fullNameLower
     * @instance
     * @public
     */
    get fullNameLower() {
        return this.fullName.toLocaleLowerCase();
    }

    // fingerprint calculation is async, but at the same time we want it to be lazy computed
    // so we cache computed result here

    // but we also want to make sure computed will be refreshed on signing key change
    // so we remember which key was used

    /**
     * Cryptographically strong User fingerprint based on signing public key.
     * Looks like '12345-12345-12345-12345-12345', empty value is '00000-00000-00000-00000-00000-00000'
     * @memberof Contact
     * @member {string} fingerprint
     * @instance
     * @public
     */
    get fingerprint() {
        if (!this.signingPublicKey) return nullFingerprint;
        if (!this.__fingerprint || this.__fingerprintKey !== this.signingPublicKey) {
            this.__fingerprintKey = this.signingPublicKey;
            cryptoUtil.getFingerprint(this.username, this.signingPublicKey).then(f => {
                this.__fingerprint = f;
            });

            return nullFingerprint;
        }
        return this.__fingerprint;
    }

    get _avatarUrl() {
        return `${serverSettings.avatarServer}/v2/avatar/${this.urlSalt}`;
    }
    /**
     * @memberof Contact
     * @member {string} largeAvatarUrl
     * @instance
     * @public
     */
    get largeAvatarUrl() {
        if (!this.hasAvatar) return null;
        return `${this._avatarUrl}/large/?${this.profileVersion}`;
    }
    /**
     * @memberof Contact
     * @member {string} mediumAvatarUrl
     * @instance
     * @public
     */
    get mediumAvatarUrl() {
        if (!this.hasAvatar) return null;
        // todo: returning large size here to deal with 64px upscaling to 80px on retina mess
        return `${this._avatarUrl}/large/?${this.profileVersion}`;
    }

    /**
     * Same as {@link fingerprint}, but formatted as: '1234 5123 4512\n3451 2345 1234 5123 45'
     * @memberof Contact
     * @member {string} fingerprintSkylarFormatted
     * @instance
     * @public
     */
    get fingerprintSkylarFormatted() {
        let i = 0;
        return this.fingerprint.replace(/-/g, '').match(/.{1,5}/g).join(' ').replace(/ /g, () => i++ === 2 ? '\n' : ' ');
    }

    /**
     * Server said it couldn't find this user.
     * @member {boolean}
     * @public
     */

    /**
     * Legacy contacts can't be used so they should treated as 'notFound' but clients can inform user about legacy
     * contact pending migration if this flag is `true` after loading is done.
     * @member {boolean}
     * @public
     */

    // to avoid parallel queries


    // {username: string, resolve: function, reject: function}

    static smartRequestStartExecutor() {
        if (Contact.smartRequestTimer) return;
        Contact.lastTimerInterval = clientApp.updatingAfterReconnect ? 2000 : 300;
        console.log('Starting batch executor with interval', Contact.lastTimerInterval);
        Contact.smartRequestTimer = setInterval(Contact.smartRequestExecutor, Contact.lastTimerInterval);
    }

    static smartRequestExecutor() {
        if (Date.now() - Contact.lastAdditionTime < Contact.lastTimerInterval && Contact.smartRequestQueue.length < 50) return;
        if (!Contact.smartRequestQueue.length) {
            clearInterval(Contact.smartRequestTimer);
            Contact.smartRequestTimer = null;
            return;
        }
        const usernames = Contact.smartRequestQueue.splice(0, 50); // 50 - max allowed batch size on server
        console.log(`Batch requesting ${usernames.length} lookups`);
        socket.send('/auth/user/lookup', { string: usernames.map(u => u.username) }).then(res => {
            for (let i = 0; i < usernames.length; i++) {
                usernames[i].resolve([res[i]]);
            }
        }).catch(err => {
            console.error(err);
            usernames.forEach(u => u.reject(err));
        });
    }

    static smartRequest(username) {
        return new Promise((resolve, reject) => {
            Contact.smartRequestQueue.push({ username, resolve, reject });
            Contact.lastAdditionTime = Date.now();
            Contact.smartRequestStartExecutor();
        });
    }

    /**
     * Loads user data from server (or applies prefetched data)
     * @param {Object} [prefetchedData]
     * @public
     */
    load(prefetchedData) {
        if (!this.loading || this._waitingForResponse) return;
        // console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        this._waitingForResponse = true;

        (prefetchedData ? Promise.resolve(prefetchedData) : Contact.smartRequest(this.username)).then(action(resp => {
            const profile = resp && resp[0] && resp[0][0] && resp[0][0].profile || null;
            if (!profile || profile.legacy) {
                this.notFound = true;
                this.isLegacy = !!(profile ? profile.legacy : false);
                this._waitingForResponse = false;
                this.loading = false;
                return;
            }
            this.username = profile.username;
            this.usernameTag = `@${this.username}`;
            this.firstName = profile.firstName || '';
            this.lastName = profile.lastName || '';
            this.urlSalt = profile.urlSalt;
            this.hasAvatar = profile.hasAvatar;
            this.isDeleted = !!profile.isDeleted;
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
        })).catch(err => {
            this._waitingForResponse = false;
            if (!prefetchedData) {
                setTimeout(() => {
                    socket.onceAuthenticated(() => this.load());
                }, 3000);
            }
            console.log(err);
        });
    }

    /**
     * Loads or creates Tofu keg and verifies Tofu data, check `tofuError` observable.
     * @returns {Promise}
     * @protected
     */
    loadTofu() {
        // console.log('Loading tofu:', this.username);
        return Tofu.getByUsername(this.username).then(action(tofu => {
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
                // todo: add checks similar to receipt keg dedupe
                newTofu.saveToServer();
                return;
            }
            // flagging contact
            if (tofu.encryptionPublicKey !== cryptoUtil.bytesToB64(this.encryptionPublicKey) || tofu.signingPublicKey !== cryptoUtil.bytesToB64(this.signingPublicKey)) {
                this.tofuError = true;
            }
            // overriding whatever server returned for contact with our stored keys
            // so crypto operations will fail in case of difference
            // todo: this works only until we implement key change feature
            this.encryptionPublicKey = cryptoUtil.b64ToBytes(tofu.encryptionPublicKey);
            this.signingPublicKey = cryptoUtil.b64ToBytes(tofu.signingPublicKey);
        }));
    }

    /**
     * Helper function to execute callback when contact is loaded.
     * Executes immediately if already loaded.
     * @param {function} callback
     * @public
     */
    whenLoaded(callback) {
        // it is important for this to be async
        when(() => !this.loading && getContactStore().myContacts.loaded, () => setTimeout(() => callback(this)));
    }
    /**
     * Helper function to get a promise that resolves when contact is loaded.
     * @returns {Promise}
     * @public
     */
    ensureLoaded() {
        return new Promise(resolve => {
            this.whenLoaded(resolve);
        });
    }
    /**
     * Helper function to get a promise that resolves when all contacts in passed collection are loaded.
     * @static
     * @param {Array<Contact>} contacts
     * @returns {Promise}
     * @memberof Contact
     * @public
     */
    static ensureAllLoaded(contacts) {
        return Promise.map(contacts, contact => contact.ensureLoaded());
    }
}, _class2.smartRequestQueue = [], _class2.smartRequestTimer = null, _class2.lastTimerInterval = 0, _class2.lastAdditionTime = 0, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'loading', [observable], {
    enumerable: true,
    initializer: function () {
        return true;
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'firstName', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'lastName', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'encryptionPublicKey', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'signingPublicKey', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'tofuError', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'isAdded', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, 'urlSalt', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, 'profileVersion', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, 'hasAvatar', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, 'isDeleted', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'color', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'color'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'letter', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'letter'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fullName', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fullName'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fullNameAndUsername', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fullNameAndUsername'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fullNameLower', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fullNameLower'), _class.prototype), _descriptor12 = _applyDecoratedDescriptor(_class.prototype, '__fingerprint', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'fingerprint', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fingerprint'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, '_avatarUrl', [computed], Object.getOwnPropertyDescriptor(_class.prototype, '_avatarUrl'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'largeAvatarUrl', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'largeAvatarUrl'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'mediumAvatarUrl', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'mediumAvatarUrl'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fingerprintSkylarFormatted', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fingerprintSkylarFormatted'), _class.prototype)), _class);


module.exports = Contact;