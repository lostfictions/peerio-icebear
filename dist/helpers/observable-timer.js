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

/**
 * Observable timer counter up/down.
 * @public
 */
let Timer = (_class = class Timer {
    constructor() {
        _initDefineProp(this, 'counter', _descriptor, this);

        this._increment = () => {
            if (this.counter >= this._max) {
                clearInterval(this._interval);
                return;
            }
            this.counter++;
        };

        this._decrement = () => {
            if (this.counter <= 0) {
                clearInterval(this._interval);
                return;
            }
            this.counter--;
        };
    }

    /**
     * Starts counting from 0 to passed seconds amount, updates every second.
     * @param {any} seconds - number of seconds to count to
     * @public
     */
    countUp(seconds) {
        this.counter = 0;
        this._max = Math.round(seconds);
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(this._increment, 1000);
    }
    /**
     * Starts counting from passed seconds amount to 0, updates every second.
     * @param {any} seconds - number of seconds to count from
     * @public
     */
    countDown(seconds) {
        this.counter = Math.round(seconds);
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(this._decrement, 1000);
    }

    /**
     * Stops counting and resets counter to 0
     * @public
     */
    stop() {
        if (this._interval) clearInterval(this._interval);
        this.counter = 0;
    }

}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'counter', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
})), _class);


module.exports = Timer;