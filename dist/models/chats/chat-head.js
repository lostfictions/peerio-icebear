'use strict';

var _desc, _value, _class, _descriptor, _descriptor2;

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

const SyncedKeg = require('../kegs/synced-keg');
const { observable } = require('mobx');

/**
 * Chat head keg is open for any chat participant to update.
 * @param {ChatKegDb} db
 * @extends SyncedKeg
 * @public
 */
let ChatHead = (_class = class ChatHead extends SyncedKeg {
    constructor(db) {
        super('chat_head', db);

        _initDefineProp(this, 'chatName', _descriptor, this);

        _initDefineProp(this, 'purpose', _descriptor2, this);
    }

    /**
     * @member {string} chatName
     * @memberof ChatHead
     * @instance
     * @public
     */

    /**
     * @member {string} purpose
     * @memberof ChatHead
     * @instance
     * @public
     */


    serializeKegPayload() {
        return {
            chatName: this.chatName,
            purpose: this.purpose
        };
    }

    deserializeKegPayload(payload) {
        this.chatName = payload.chatName || '';
        this.purpose = payload.purpose || '';
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'chatName', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'purpose', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
})), _class);


module.exports = ChatHead;