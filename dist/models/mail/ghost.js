'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11;

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

const { observable, computed, action } = require('mobx');
const moment = require('moment');
const Keg = require('../kegs/keg');
const { cryptoUtil } = require('../../crypto/index');
const User = require('../user/user');
const PhraseDictionary = require('../phrase-dictionary');
const config = require('../../config');
const defaultClock = require('../../helpers/observable-clock').default;
const ghostAPI = require('./ghost.api'); // most of the ghost-specific logic is in here

let Ghost = (_class = class Ghost extends Keg {
    // 3 days
    get date() {
        return moment(this.timestamp);
    }

    get preview() {
        return this.body && this.body.length > 0 ? this.body.substring(0, 120).replace(/^[\r\n]*/g, '').replace(/\r*\n/g, ' ') : '...';
    }

    get url() {
        return `${config.ghostFrontendUrl}/?${this.ghostId}`;
    }

    get expiryDate() {
        return new Date(this.timestamp + this.lifeSpanInSeconds * 1000);
    }

    get fileCounter() {
        return this.files.length;
    }

    get expired() {
        return this.timestamp + this.lifeSpanInSeconds * 1000 < defaultClock.now;
    }

    get ephemeralKeypair() {
        return this.keypair;
    }

    set ephemeralKeypair(kp) {
        this.keypair = kp;
    }

    /*
     * Constructor.
     *
     * NOTE: ghost IDs are in hex for browser compatibility.
     */
    constructor(db) {
        super(null, 'ghost', db);
        this.DEFAULT_GHOST_LIFESPAN = 259200;
        this.DEFAULT_GHOST_PASSPHRASE_LENGTH = 5;

        _initDefineProp(this, 'sending', _descriptor, this);

        _initDefineProp(this, 'sendError', _descriptor2, this);

        _initDefineProp(this, 'subject', _descriptor3, this);

        _initDefineProp(this, 'recipients', _descriptor4, this);

        _initDefineProp(this, 'files', _descriptor5, this);

        _initDefineProp(this, 'passphrase', _descriptor6, this);

        _initDefineProp(this, 'timestamp', _descriptor7, this);

        _initDefineProp(this, 'sent', _descriptor8, this);

        _initDefineProp(this, 'lifeSpanInSeconds', _descriptor9, this);

        _initDefineProp(this, 'revoked', _descriptor10, this);

        _initDefineProp(this, 'body', _descriptor11, this);

        this.revoke = this.revoke.bind(this);
        this.version = 2;
        this.passphrase = PhraseDictionary.current.getPassphrase(this.DEFAULT_GHOST_PASSPHRASE_LENGTH);
        // encode user-specific ID in hex
        this.ghostId = cryptoUtil.getRandomUserSpecificIdHex(User.current.username);
    }

    /*
     * ghost id
     * @returns {{ghostId: (String|*)}}
     */
    serializeProps() {
        return {
            ghostId: this.ghostId
        };
    }

    /*
     * To be saved to kegs.
     *
     * @returns {Object}
     */
    serializeKegPayload() {
        return {
            subject: this.subject,
            passphrase: this.passphrase,
            recipients: this.recipients.slice(),
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files.slice(),
            body: this.body,
            timestamp: this.timestamp,
            revoked: this.revoked
        };
    }

    deserializeProps(props) {
        this.ghostId = props.ghostId;
    }

    /*
     * Load existing (sent) ghost from keg storage.
     *
     * @param {Object} data
     */
    deserializeKegPayload(data) {
        this.body = data.body;
        this.subject = data.subject;
        this.passphrase = data.passphrase;
        this.files = data.files;
        this.timestamp = data.timestamp;
        this.recipients = data.recipients;
        this.sent = true;
        this.lifeSpanInSeconds = data.lifeSpanInSeconds;
        this.revoked = data.revoked;
    }

    /*
     * Send a ghost.
     *
     * @param {string} text - message content
     */
    send(text) {
        this.sending = true;
        this.body = text;
        this.timestamp = Date.now();
        this.lifeSpanInSeconds = this.DEFAULT_GHOST_LIFESPAN;

        return ghostAPI.deriveKeys(this).then(() => ghostAPI.serialize(this, User.current)).then(serializedGhost => ghostAPI.encrypt(this, User.current, serializedGhost)).then(res => ghostAPI.send(this, res)).then(() => this.saveToServer()).then(() => {
            this.sent = true;
        }).catch(err => {
            this.sendError = true;
            console.error('Error sending ghost', err);
            return Promise.reject(err);
        }).finally(() => {
            this.sending = false;
        });
    }

    /*
     * Attaches files.
     *
     * @param {Array<File>} files
     */
    attachFiles(files) {
        this.files.clear();
        if (!files || !files.length) return null;
        files.forEach(file => {
            this.files.push(file.fileId);
        });
        return files.slice();
    }

    /*
     * Destroy the public-facing ghost.
     * @returns {Promise}
     */
    revoke() {
        return ghostAPI.revoke(this).then(() => this.saveToServer());
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'sending', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'sendError', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'subject', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'recipients', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowArray([]);
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'files', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowArray([]);
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'passphrase', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'timestamp', [observable], {
    enumerable: true,
    initializer: function () {
        return Date.now();
    }
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, 'sent', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, 'lifeSpanInSeconds', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, 'revoked', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, 'body', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _applyDecoratedDescriptor(_class.prototype, 'date', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'date'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'preview', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'preview'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'url', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'url'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'expiryDate', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'expiryDate'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileCounter', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileCounter'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'expired', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'expired'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeProps', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeProps'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeKegPayload', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeKegPayload'), _class.prototype)), _class);


module.exports = Ghost;