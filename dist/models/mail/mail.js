'use strict';

var _dec, _dec2, _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;

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

const moment = require('moment');
const Keg = require('./../kegs/keg');
const { observable, computed, action } = require('mobx');
const { cryptoUtil, secret } = require('../../crypto');
const socket = require('../../network/socket');
const { getUser } = require('../../helpers/di-current-user');
const { retryUntilSuccess } = require('../../helpers/retry');

let Mail = (_dec = observable.shallow, _dec2 = observable.shallow, (_class = class Mail extends Keg {
    constructor(db) {
        super(null, 'mail', db);

        _initDefineProp(this, 'messageId', _descriptor, this);

        _initDefineProp(this, 'sentId', _descriptor2, this);

        _initDefineProp(this, 'replyId', _descriptor3, this);

        _initDefineProp(this, 'subject', _descriptor4, this);

        _initDefineProp(this, 'body', _descriptor5, this);

        _initDefineProp(this, 'timestamp', _descriptor6, this);

        _initDefineProp(this, 'sender', _descriptor7, this);

        _initDefineProp(this, 'recipients', _descriptor8, this);

        _initDefineProp(this, 'files', _descriptor9, this);

        _initDefineProp(this, 'sending', _descriptor10, this);

        _initDefineProp(this, 'sent', _descriptor11, this);

        _initDefineProp(this, 'selected', _descriptor12, this);

        _initDefineProp(this, 'show', _descriptor13, this);

        _initDefineProp(this, 'deleted', _descriptor14, this);
    }

    // -- Model data
    // ---------------------------------------------------------------------------------------------
    // When sending a message, the sender assigns a random messageId to it and
    // recipients receive the message with this messageId.
    //
    // After sending it, the sender also saves the message for themselves (to
    // implement "Sent" folder or threading), but changes messageId to a new
    // random value and assigns the previously used sent messageId to sentId to
    // keep track of which messages it was correponding to. The presence of
    // sentId also indicates that this message is outgoing.


    // If the message is a reply to some message, replyId is assigned
    // to this source message's messageId.


    // -- View state data ----------------------------------------------------------------------------------------
    // is this message sending

    // was this message sent

    // is this mail selected

    // is this mail visible or filtered by search

    // is this mail deleted


    // -- computed properties ------------------------------------------------------------------------------------

    get date() {
        return moment(this.timestamp);
    }

    get fileCounter() {
        return this.files.length;
    }

    // -- keg serializators --------------------------------------------------------------------------------------
    serializeKegPayload() {
        const ret = {
            messageId: this.messageId,
            recipients: this.recipients,
            subject: this.subject,
            body: this.body,
            files: this.files.slice(),
            timestamp: this.timestamp
        };
        if (this.sentId) ret.sentId = this.sentId;
        if (this.replyId) ret.replyId = this.replyId;
    }

    deserializeKegPayload(data) {
        this.messageId = data.messageId;
        this.sentId = data.sentId;
        this.replyId = data.replyId;
        this.recipients = data.recipients;
        this.subject = data.subject;
        this.body = data.body;
        this.files = data.files;
        this.timestamp = data.timestamp;
    }

    serializeProps() {
        const ret = {};
        ret.messageId = this.messageId;
        ret.recipients = JSON.stringify(this.recipients);
        if (this.sentId) ret.sentId = this.sentId;
        if (this.replyId) ret.replyId = this.replyId;
        if (this.files) ret.files = JSON.stringify(this.files);
        return ret;
    }

    deserializeProps(props) {
        // The source of truth for messageId, sentId, replyId, files, and
        // recipients is the payload, so we don't deserialize them here.
        this.sender = props.sharedBy;
    }

    // -- class methods ------------------------------------------------------------------------------------------
    send(contacts) {
        this.sending = true;
        this.timestamp = Date.now();
        this.sender = getUser().username;
        this.assignTemporaryId();
        this.messageId = cryptoUtil.getRandomUserSpecificIdB64(this.sender);
        this.recipients = contacts.map(c => c.username);

        // Generate a new random payload key.
        const payloadKey = cryptoUtil.getRandomBytes(32);

        // Serialize payload.
        const payload = JSON.stringify(this.serializeKegPayload());

        // Encrypt payload with the payload key.
        const encryptedPayload = secret.encryptString(payload, payloadKey);

        // Encrypt message key for each recipient's public key.
        //
        // {
        //   "user1": { "publicKey": ..., "encryptedKey": ... },
        //   "user2": { "publicKey": ..., "encryptedKey": ... }
        //   ...
        //  }
        //
        const recipients = {};
        contacts.forEach(contact => {
            recipients[contact.username] = {
                publicKey: cryptoUtil.bytesToB64(contact.encryptionPublicKey),
                encryptedPayloadKey: cryptoUtil.bytesToB64(secret.encryptString(payloadKey, getUser().getSharedKey(contact.encryptionPublicKey)))
            };
        });

        const data = {
            recipients,
            keg: {
                type: this.type,
                payload: encryptedPayload.buffer,
                props: this.serializeProps()
            }
        };

        // when we implement key change history, this will help to figure out which key to use
        // this properties should not be blindly trusted, recipient verifies them
        data.keg.props.sharedKegSenderPK = cryptoUtil.bytesToB64(getUser().encryptionKeys.publicKey);

        return retryUntilSuccess(() => socket.send('/auth/kegs/send', data)).then(() => {
            this.sent = true;
            // Save an outgoing copy, changing ids.
            this.sentId = this.messageId;
            this.messageId = this.cryptoUtil.getRandomUserSpecificIdB64(this.sender);
            return retryUntilSuccess(() => this.saveToServer(true));
        }).finally(action(() => {
            this.sending = false;
        }));
    }

    remove() {
        if (!this.id) return Promise.resolve();
        return retryUntilSuccess(() => super.remove(), `remove mail ${this.id}`).then(() => {
            this.deleted = true;
        });
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'messageId', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'sentId', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'replyId', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'subject', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'body', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'timestamp', [observable], {
    enumerable: true,
    initializer: function () {
        return Date.now();
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'sender', [observable], {
    enumerable: true,
    initializer: null
}), _descriptor8 = _applyDecoratedDescriptor(_class.prototype, 'recipients', [_dec], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _descriptor9 = _applyDecoratedDescriptor(_class.prototype, 'files', [_dec2], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _descriptor10 = _applyDecoratedDescriptor(_class.prototype, 'sending', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor11 = _applyDecoratedDescriptor(_class.prototype, 'sent', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor12 = _applyDecoratedDescriptor(_class.prototype, 'selected', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor13 = _applyDecoratedDescriptor(_class.prototype, 'show', [observable], {
    enumerable: true,
    initializer: function () {
        return true;
    }
}), _descriptor14 = _applyDecoratedDescriptor(_class.prototype, 'deleted', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _applyDecoratedDescriptor(_class.prototype, 'date', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'date'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'fileCounter', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'fileCounter'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeKegPayload', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeKegPayload'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deserializeProps', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeProps'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'send', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'send'), _class.prototype)), _class));


module.exports = Mail;