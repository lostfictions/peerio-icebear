'use strict';

var _desc, _value, _class, _descriptor;

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

const { observable } = require('mobx');
const Keg = require('../kegs/keg');

/**
 * Holds read position (kegId) for a user in a chat. Named keg, names contain usernames.
 * @param {string} username
 * @param {ChatKegDb} db
 * @extends {Keg}
 * @public
 */
let ReadReceipt = (_class = class ReadReceipt extends Keg {

    constructor(username, db) {
        super(username ? `read_receipt-${username}` : null, 'read_receipt', db, false, false, true);

        _initDefineProp(this, 'chatPosition', _descriptor, this);
    }
    /**
     * true if this receipt's name doesn't match keg owner.
     * @member {bool}
     * @public
     */


    serializeKegPayload() {
        return {
            chatPosition: +this.chatPosition
        };
    }

    deserializeKegPayload(payload) {
        this.chatPosition = +(payload.chatPosition || 0);
    }

    afterLoad() {
        this.receiptError = !this.id.endsWith(`-${this.owner}`);
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'chatPosition', [observable], {
    enumerable: true,
    initializer: null
})), _class);


module.exports = ReadReceipt;