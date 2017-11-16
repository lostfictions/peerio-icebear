'use strict';

var _dec, _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;

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
const mixUserProfileModule = require('./user.profile.js');
const mixUserRegisterModule = require('./user.register.js');
const mixUserAuthModule = require('./user.auth.js');
const mixUser2faModule = require('./user.2fa.js');
const KegDb = require('./../kegs/keg-db');
const TinyDb = require('../../db/tiny-db');
const { observable, when, computed } = require('mobx');
const currentUserHelper = require('./../../helpers/di-current-user');
const { publicCrypto } = require('../../crypto/index');
const { formatBytes, tryToGet } = require('../../util');
const config = require('../../config');
const MRUList = require('../../helpers/mru-list');
const migrator = require('../../legacy/account_migrator');
const { ServerError } = require('../../errors');
const warnings = require('../warnings');
const clientApp = require('../client-app');

/** @type {User} */
let currentUser;

/**
 * Class represents application user, you have to create and instance and assign it to `User.current`
 * on sign in. All systems depend on `User.current` to be set at the moment socket is authenticated.
 *
 * User has a lot of members and they all appear to be in the same place in documentation, but in sources
 * members are grouped by theme in several files. That said, User class and registration/authentication code
 * specifically requires refactoring to improve readability and reduce state-mutating functions amount.
 *
 * Many private and protected members are not documented with jsdoc tags to avoid clutter.
 * @public
 */
let User = (_dec = observable.ref, (_class = class User {
    /**
     * @member {string} username
     * @public
     */
    get username() {
        return this._username;
    }

    set username(v) {
        this._username = typeof v === 'string' ? v.trim().toLowerCase() : '';
    }
    // -- profile data
    /**
     * @member {string} firstName
     * @memberof User
     * @instance
     * @public
     */

    /**
     * @member {string} lastName
     * @memberof User
     * @instance
     * @public
     */

    /**
     * @member {string} email
     * @memberof User
     * @instance
     * @public
     */

    /**
     * @member {string} locale
     * @memberof User
     * @instance
     * @public
     */

    /**
     * Currently unused, maybe we will bring passcodes back eventually
     * @member {boolean} passcodeIsSet
     * @memberof User
     * @instance
     * @public
     */

    /**
     * Quota object as received from server, it has complex and weird format.
     * You don't need to use this directly, use computed properties that are based on this.
     * @member {Object} quota
     * @memberof User
     * @instance
     * @protected
     */

    /**
     * Sets to `true` when profile is loaded for the first time and is not empty anymore.
     * @member {boolean} profileLoaded
     * @memberof User
     * @instance
     * @public
     */

    /**
     * Quota object as received from server, it has complex and weird format.
     * You don't need to use this directly, use computed properties that are based on this.
     * @member {Array<Address>} addresses
     * @memberof User
     * @instance
     * @protected
     */

    /**
     * @member {boolean} primaryAddressConfirmed
     * @memberof User
     * @instance
     * @public
     */

    /**
     * @member {boolean} deleted
     * @memberof User
     * @instance
     * @public
     */

    /**
     * @member {boolean} blacklisted
     * @memberof User
     * @instance
     * @public
     */

    /**
     * Don't try to upload another avatar while this is `true`
     * @member {boolean} savingAvatar
     * @memberof User
     * @instance
     * @public
     */

    /**
     * UI-controlled flag, Icebear doesn't use it
     * @member {boolean} autologinEnabled
     * @memberof User
     * @instance
     * @public
     */

    /**
     * UI-controlled flag, Icebear doesn't use it
     * @member {boolean} secureWithTouchID
     * @memberof User
     * @instance
     * @public
     */


    /**
     * Indicates 2fa state on current user.
     * @member {boolean} twoFAEnabled
     * @memberof User
     * @instance
     * @readonly
     * @public
     */


    /**
     * Computed `firstName+' '+lastName`
     * @member {string} fullName
     * @memberof User
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
     * Account creation timestamp. Is null until `profileLoaded != true`.
     * @member {number}
     * @public
     */

    // -- key data
    /**
     * @member {string}
     * @public
     */

    /**
     * @member {Uint8Array}
     * @public
     */

    /**
     * Key for SELF database boot keg.
     * @member {Uint8Array}
     * @protected
     */

    /**
     * @member {KeyPair}
     * @public
     */

    /**
     * @member {KeyPair}
     * @public
     */

    /**
     * @member {KeyPair}
     * @public
     */

    /**
     * Key for SELF keg database.
     * @member {Uint8Array}
     * @protected
     */

    // -- flags


    /**
     * Most recently used emoji.
     * @member {MRUList}
     * @public
     */


    constructor() {
        this._username = '';

        _initDefineProp(this, 'firstName', _descriptor, this);

        _initDefineProp(this, 'lastName', _descriptor2, this);

        _initDefineProp(this, 'email', _descriptor3, this);

        _initDefineProp(this, 'locale', _descriptor4, this);

        _initDefineProp(this, 'passcodeIsSet', _descriptor5, this);

        _initDefineProp(this, 'quota', _descriptor6, this);

        _initDefineProp(this, 'profileLoaded', _descriptor7, this);

        _initDefineProp(this, 'addresses', _descriptor8, this);

        _initDefineProp(this, 'primaryAddressConfirmed', _descriptor9, this);

        _initDefineProp(this, 'deleted', _descriptor10, this);

        _initDefineProp(this, 'blacklisted', _descriptor11, this);

        _initDefineProp(this, 'savingAvatar', _descriptor12, this);

        _initDefineProp(this, 'autologinEnabled', _descriptor13, this);

        _initDefineProp(this, 'secureWithTouchID', _descriptor14, this);

        _initDefineProp(this, 'twoFAEnabled', _descriptor15, this);

        this.createdAt = null;
        this._firstLoginInSession = true;
        this.emojiMRU = new MRUList('emojiPicker', 30);

        this.canUploadFileSize = size => {
            return this.fileQuotaLeft >= this._adjustedOverheadFileSize(size);
        };

        this.canUploadMaxFileSize = size => {
            const realSize = this._adjustedOverheadFileSize(size);
            return realSize <= this.fileSizeLimit;
        };

        this.createAccountAndLogin = () => {
            console.log('Starting account registration sequence.');

            return this._createAccount().then(() => this._authenticateConnection()).then(() => {
                console.log('Creating boot keg.');
                return this.kegDb.createBootKeg(this.bootKey, this.signKeys, this.encryptionKeys, this.kegKey);
            }).then(() => this._postAuth()).tapCatch(socket.reset);
        };

        this.setReauthOnReconnect = () => {
            // only need to set reauth listener once
            if (this.stopReauthenticator) return;
            this.stopReauthenticator = socket.subscribe(socket.SOCKET_EVENTS.connect, this.login);
        };

        this._sharedKeyCache = {};

        this.login = this.login.bind(this);
        this.kegDb = new KegDb('SELF');
        // this is not really extending prototype, but we don't care because User is almost a singleton
        // (new instance created on every initial login attempt only)
        mixUserProfileModule.call(this);
        mixUserAuthModule.call(this);
        mixUserRegisterModule.call(this);
        mixUser2faModule.call(this);
    }

    /**
     * All current active plan names
     * @member {Array<string>} activePlans
     * @memberof User
     * @instance
     * @public
     */
    get activePlans() {
        if (this.quota == null || this.quota.quotas === null) return [];
        const { quotas } = this.quota;
        return Object.getOwnPropertyNames(quotas).map(k => quotas[k].plan).filter(p => !!p);
    }

    /**
     * Total amounts of bytes user can upload.
     * @member {number} fileQuotaTotal
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaTotal() {
        if (this.quota == null || !this.quota.resultingQuotas || !this.quota.resultingQuotas.file || !this.quota.resultingQuotas.file.length) return 0;

        const found = this.quota.resultingQuotas.file.find(item => item.period === 'total' && item.metric === 'storage');
        if (!found) return 0;
        if (found.limit == null) return Number.MAX_SAFE_INTEGER;
        return found.limit;
    }

    /**
     * Formatted total amounts of bytes user can upload.
     * @member {string} fileQuotaTotalFmt
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaTotalFmt() {
        return formatBytes(this.fileQuotaTotal);
    }

    /**
     * Free bytes left for uploads.
     * @member {number} fileQuotaLeft
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaLeft() {
        if (this.quota == null || !this.quota.quotasLeft || !this.quota.quotasLeft.file || !this.quota.quotasLeft.file.length) return 0;

        const found = this.quota.quotasLeft.file.find(item => item.period === 'total' && item.metric === 'storage');
        if (!found) return 0;
        if (found.limit == null) return Number.MAX_SAFE_INTEGER;
        return found.limit;
    }

    /**
     * Formatted bytes left for uploads.
     * @member {string} fileQuotaLeftFmt
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaLeftFmt() {
        return formatBytes(this.fileQuotaLeft);
    }

    /**
     * Maximum file size user can upload.
     * @member {number} fileSizeLimit
     * @memberof User
     * @instance
     * @public
     */
    get fileSizeLimit() {
        if (this.quota == null || !this.quota.resultingQuotas || !this.quota.resultingQuotas.upload || !this.quota.resultingQuotas.upload.length) return Number.MAX_SAFE_INTEGER;

        const found = this.quota.resultingQuotas.upload.find(item => item.period === 'total' && item.metric === 'maxSize');

        if (!found || found.limit == null) return Number.MAX_SAFE_INTEGER;
        return found.limit;
    }

    /**
     * Formatted maximum file size user can upload.
     * @member {number} fileSizeLimitFmt
     * @memberof User
     * @instance
     * @public
     */
    get fileSizeLimitFmt() {
        return formatBytes(this.fileSizeLimit);
    }

    /**
     * Used bytes in storage.
     * @member {number} fileQuotaUsed
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaUsed() {
        return this.fileQuotaTotal - this.fileQuotaLeft;
    }

    /**
     * Formatted used bytes in storage.
     * @member {number} fileQuotaUsedFmt
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaUsedFmt() {
        return formatBytes(this.fileQuotaUsed);
    }

    /**
     * Amount of % used bytes in storage.
     * @member {number} fileQuotaUsedPercent
     * @memberof User
     * @instance
     * @public
     */
    get fileQuotaUsedPercent() {
        return this.fileQuotaTotal === 0 ? 0 : Math.round(this.fileQuotaUsed / (this.fileQuotaTotal / 100));
    }

    /**
     * Maximum number of channels user can have
     * @member {number} channelLimit
     * @memberof User
     * @instance
     * @public
     */
    get channelLimit() {
        if (this.quota == null || !this.quota.resultingQuotas || !this.quota.resultingQuotas.channel || !this.quota.resultingQuotas.channel.length) return 0;

        const found = this.quota.resultingQuotas.channel.find(item => item.period === 'total' && item.metric === 'participate');
        if (!found) return 0;
        if (found.limit == null) return Number.MAX_SAFE_INTEGER;
        return found.limit;
    }

    /**
     * Available channel slots left.
     * @member {number} channelsLeft
     * @memberof User
     * @instance
     * @public
     */
    get channelsLeft() {
        if (this.quota == null || !this.quota.quotasLeft || !this.quota.quotasLeft.channel || !this.quota.quotasLeft.channel.length) return 0;

        const found = this.quota.quotasLeft.channel.find(item => item.period === 'total' && item.metric === 'participate');
        if (!found) return 0;
        if (found.limit == null) return Number.MAX_SAFE_INTEGER;
        return found.limit;
    }

    /**
     * Adjust file size for overhead
     * @param {number} size - amount of bytes user wants to upload
     * @returns {number} file size including overhead
     * @instance
     * @protected
     */
    _adjustedOverheadFileSize(size) {
        const chunkSize = config.upload.getChunkSize(size);
        const chunkCount = Math.ceil(size / chunkSize);
        return size + chunkCount * config.CHUNK_OVERHEAD;
    }

    /**
     * Maximum amount of people invited which give you bonus
     * @member {number} maxInvitedPeopleBonus
     * @memberof User
     * @instance
     * @public
     */
    get maxInvitedPeopleBonus() {
        // TODO[backlog]: this should be stored in server
        return 5;
    }

    /**
     * Maximum amount of people invited which give you bonus
     * @member {number} currentInvitedPeopleBonus
     * @memberof User
     * @instance
     * @public
     */
    get currentInvitedPeopleBonus() {
        // TODO[backlog]: this should be stored in server
        const bonusPerUser = 50 * 1024 * 1024;
        const limit = tryToGet(() => User.current.quota.quotas.userInviteOnboardingBonus.bonus.file.limit, 0);
        return Math.ceil(limit / bonusPerUser);
    }

    /**
     * Maximum bonus user can achieve if they complete all tasks
     * @member {number} maximumOnboardingBonus
     * @memberof User
     * @instance
     * @public
     */
    get maximumOnboardingBonus() {
        // TODO[backlog]: this should be stored in server
        const avatarBonus = 100;
        const emailConfirmedBonus = 100;
        const invitedUserBonus = 5 * 50;
        const roomBonus = 100;
        const backupBonus = 100;
        const installBonus = 100;
        const twoFABonus = 100;
        return avatarBonus + emailConfirmedBonus + invitedUserBonus + roomBonus + backupBonus + installBonus + twoFABonus;
    }

    /**
     * Maximum bonus user can achieve if they complete all tasks
     * @member {number} currentOnboardingBonus
     * @memberof User
     * @instance
     * @public
     */
    get currentOnboardingBonus() {
        if (!User.current.quota) return 0;
        const {
            createRoomOnboardingBonus,
            avatarOnboardingBonus,
            twofaOnboardingBonus,
            installsOnboardingBonus,
            backupOnboardingBonus,
            confirmedEmailBonus,
            userInviteOnboardingBonus
        } = User.current.quota.quotas;
        return tryToGet(() => [createRoomOnboardingBonus, avatarOnboardingBonus, twofaOnboardingBonus, installsOnboardingBonus, backupOnboardingBonus, confirmedEmailBonus, userInviteOnboardingBonus].reduce((sum, value) => sum + Math.ceil(value.bonus.file.limit / 1024 / 1024), 0), 0);
    }

    /**
     * Checks if there's enough storage to upload a file.
     * @param {number} size - amount of bytes user wants to upload.
     * @returns {boolean} is there enough storage left to upload.
     * @memberof User
     * @instance
     * @public
     */


    /**
     * Checks if the file size is not too big for the current plan
     * e.g. Basic - 500 Mb limit, Premium - 2 Gb. Pro - unlimited.
     * @param {number} size - amount of bytes user wants to upload.
     * @returns {boolean} is file size acceptable for current plan
     * @memberof User
     * @instance
     * @public
     */
    get hasAvatarUploadedBonus() {
        return tryToGet(() => !!this.quota.quotas.avatarOnboardingBonus.bonus.file.limit, false);
    }

    get hasConfirmedEmailBonus() {
        return tryToGet(() => !!this.addresses.find(f => f.confirmed), false);
    }

    get hasCreatedRoomBonus() {
        return tryToGet(() => !!this.quota.quotas.createRoomOnboardingBonus.bonus.file.limit, false);
    }

    get hasInvitedFriendsBonus() {
        return tryToGet(() => !!this.quota.quotas.userInviteOnboardingBonus.bonus.file.limit, false);
    }

    get hasTwoFABonus() {
        return tryToGet(() => !!this.quota.quotas.twofaOnboardingBonus.bonus.file.limit, false);
    }

    get hasInstallBonus() {
        return tryToGet(() => !!this.quota.quotas.installsOnboardingBonus.bonus.file.limit, false);
    }

    get hasAccountKeyBackedUpBonus() {
        return tryToGet(() => !!this.quota.quotas.backupOnboardingBonus.bonus.file.limit, false);
    }

    get isPremiumUser() {
        return !!this.activePlans.filter(s => config.serverPlansPremium.includes(s)).length;
    }

    get isProUser() {
        return !!this.activePlans.filter(s => config.serverPlansPro.includes(s)).length;
    }

    get hasActivePlans() {
        return !!(this.activePlans && this.activePlans.length);
    }

    /**
     * Full registration process.
     * Initial login after registration differs a little.
     * @returns {Promise}
     * @public
     */


    _preAuth() {
        if (this._firstLoginInSession) {
            return this._checkForPasscode();
        }
        return Promise.resolve();
    }

    /**
     * Authenticates connection and makes necessary initial requests.
     * @returns {Promise}
     * @public
     */
    login() {
        console.log('Starting login sequence');
        return this._preAuth().then(() => this._authenticateConnection()).then(() => this.kegDb.loadBootKeg(this.bootKey)).then(() => {
            this.encryptionKeys = this.kegDb.boot.encryptionKeys;
            this.signKeys = this.kegDb.boot.signKeys;
        }).then(() => this._postAuth()).catch(e => {
            if (e && e.code === ServerError.codes.accountMigrationRequired) {
                return migrator.authenticate(this.username, this.passphrase).then(data => {
                    this.firstName = data.firstName || this.username;
                    this.lastName = data.lastName || this.username;
                    this.email = data.primaryEmail || 'enter_your_email@localhost';
                    return this.createAccountAndLogin();
                });
            }
            if (!socket.authenticated && !clientApp.clientVersionDeprecated) {
                socket.reset();
            }
            return Promise.reject(e);
        });
    }

    _postAuth() {
        socket.setAuthenticatedState();
        if (this._firstLoginInSession) {
            this._firstLoginInSession = false;
            // TODO: when we introduce key change feature - this will fail to decrypt
            TinyDb.openUser(this.username, this.kegDb.key);
            this.setReauthOnReconnect();
            this.emojiMRU.loadCache();
            // new accounts don't have digest for these kegs (they are created on first access)
            // so loading of these kegs will not get triggered automatically
            // we really need to call this here only once - after account is created, but there's no harm
            // in repeating calls every login and it's safer this way because we don't have to account
            // for failures like we would do if we called it just once at registration.
            this.loadProfile();
            this.loadQuota();
            this.loadSettings();
            when(() => this.profileLoaded, () => {
                this.setAsLastAuthenticated().catch(err => console.error(err)); // not critical, we can ignore this error
            });
        }
    }

    /**
     * Currently authenticated user.
     * @static
     * @member {User}
     * @memberof User
     * @public
     */
    static get current() {
        return currentUser;
    }

    static set current(val) {
        currentUser = val;
        currentUserHelper.setUser(val);
    }

    /**
     * Gets the last authenticated user.
     * @returns {Promise<?{username:string,firstName:string,lastName:string}>}
     * @public
     */
    static getLastAuthenticated() {
        return TinyDb.system.getValue(`last_user_authenticated`);
    }

    /**
     * Saves the data of the last authenticated user.
     * @returns {Promise}
     * @public
     */
    setAsLastAuthenticated() {
        return TinyDb.system.setValue(`last_user_authenticated`, {
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName
        });
    }

    /**
     * Removes last authenticated user information.
     * @returns {Promise}
     * @public
     */
    static removeLastAuthenticated() {
        return TinyDb.system.removeValue(`last_user_authenticated`);
    }

    // Cache for precomputed asymmetric encryption shared keys,
    // where secretKey == this.encryptionKeypair.secretKey.
    // We don't place this into crypto module to avoid shooting ourselves in the knee in numerous ways


    /**
     * Computes or gets from cache shared encryption key for a public key.
     * @param {Uint8Array} theirPublicKey
     * @return {Uint8Array}
     * @protected
     */
    getSharedKey(theirPublicKey) {
        if (!(theirPublicKey instanceof Uint8Array)) throw new Error('Invalid argument type');
        const cacheKey = theirPublicKey.join(',');
        let cachedValue = this._sharedKeyCache[cacheKey];
        if (cachedValue) return cachedValue;
        cachedValue = publicCrypto.computeSharedKey(theirPublicKey, this.encryptionKeys.secretKey);
        this._sharedKeyCache[cacheKey] = cachedValue;
        return cachedValue;
    }

    deleteAccount(username) {
        if (username !== this.username) {
            return Promise.reject(new Error('Pass username to delete current user account.'));
        }
        if (!this.primaryAddressConfirmed) {
            warnings.addSevere('error_deletingAccountNoConfirmedEmail');
            return Promise.reject();
        }
        return socket.send('/auth/user/close').catch(err => {
            console.error(err);
            warnings.addSevere('error_deletingAccount');
            return Promise.reject(err);
        });
    }

    clearFromTinyDb() {
        return Promise.all([TinyDb.user.clear(), User.removeLastAuthenticated(), TinyDb.system.removeValue(`${User.current.username}:deviceToken`)]);
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'firstName', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'lastName', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'email', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'locale', [observable], {
    enumerable: true,
    initializer: function () {
        return 'en';
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'passcodeIsSet', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'quota', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'profileLoaded', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, 'addresses', [_dec], {
    enumerable: true,
    initializer: null
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, 'primaryAddressConfirmed', [observable], {
    enumerable: true,
    initializer: null
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, 'deleted', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, 'blacklisted', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor12 = _applyDecoratedDescriptor(_class.prototype, 'savingAvatar', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor13 = _applyDecoratedDescriptor(_class.prototype, 'autologinEnabled', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor14 = _applyDecoratedDescriptor(_class.prototype, 'secureWithTouchID', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor15 = _applyDecoratedDescriptor(_class.prototype, 'twoFAEnabled', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'fullName', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fullName'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'activePlans', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'activePlans'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaTotal', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaTotal'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaTotalFmt', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaTotalFmt'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaLeft', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaLeft'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaLeftFmt', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaLeftFmt'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileSizeLimit', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileSizeLimit'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileSizeLimitFmt', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileSizeLimitFmt'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaUsed', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaUsed'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaUsedFmt', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaUsedFmt'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileQuotaUsedPercent', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileQuotaUsedPercent'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'channelLimit', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'channelLimit'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'channelsLeft', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'channelsLeft'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'maxInvitedPeopleBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'maxInvitedPeopleBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'currentInvitedPeopleBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'currentInvitedPeopleBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'maximumOnboardingBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'maximumOnboardingBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'currentOnboardingBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'currentOnboardingBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasAvatarUploadedBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasAvatarUploadedBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasConfirmedEmailBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasConfirmedEmailBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasCreatedRoomBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasCreatedRoomBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasInvitedFriendsBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasInvitedFriendsBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasTwoFABonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasTwoFABonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasInstallBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasInstallBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasAccountKeyBackedUpBonus', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasAccountKeyBackedUpBonus'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'isPremiumUser', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isPremiumUser'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'isProUser', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isProUser'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'hasActivePlans', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasActivePlans'), _class.prototype)), _class));


module.exports = User;