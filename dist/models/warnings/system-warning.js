'use strict';

var _desc, _value, _class, _descriptor, _class2, _temp;

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
 * Base/local class for warnings. Server warnings class inherits from it.
 * You don't need to instantiate it directly, Icebear warnings module has a factory for that.
 * @class
 * @param {string} content - localization string key
 * @param {string} [title] - localization string key
 * @param {Object} [data] - variables to pass to peerio-translator when resolving content
 * @param {string} [level='medium'] - severity level, options (medium, severe)
 * @protected
 */
let SystemWarning = (_class = (_temp = _class2 = class SystemWarning {
    /**
     * Warning life cycle states.
     * @static
     * @memberof SystemWarning
     * @protected
     */
    constructor(content, title, data, level = 'medium', callback) {
        _initDefineProp(this, 'state', _descriptor, this);

        this.content = content;
        this.title = title;
        this.data = data;
        this.level = level;
        this.callback = callback;
    }

    /**
     * Advances life cycle state to SHOWING
     * @protected
     */


    /**
     * Observable current life cycle state.
     * @member {number} state
     * @memberof SystemWarning
     * @instance
     * @protected
     */
    show() {
        if (this.state !== SystemWarning.STATES.QUEUED) return;
        // this.state = SystemWarning.STATES.WILL_SHOW;
        // setTimeout(() => {
        this.state = SystemWarning.STATES.SHOWING;
        // }, 1000);
    }
    /**
     * Advances life cycle state to final status.
     * Does it gradually to allow UI animations to execute.
     * @protected
     */
    dismiss() {
        if (this.state > SystemWarning.STATES.SHOWING) return;
        this.state = SystemWarning.STATES.WILL_DISMISS;
        setTimeout(() => {
            this.dispose();
            this.state = SystemWarning.STATES.DISMISSED;
            if (this.callback) this.callback();
        }, 700);
    }

    /**
     * Starts a timer that will dismiss the warning automatically.
     * @protected
     */
    autoDismiss() {
        if (this.state > SystemWarning.STATES.SHOWING) return;
        if (this.timer) return;
        this.timer = setTimeout(() => {
            this.dismiss();
            this.timer = null;
        }, 7000);
    }
    /**
     * Removes auto-dismiss timer
     * @protected
     */
    cancelAutoDismiss() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     *  Does nothing in this class, but you can override it in child class if needed.
     *  Will get called after warning dismiss.
     *  @protected
     */
    dispose() {}
}, _class2.STATES = {
    QUEUED: 0, /* WILL_SHOW: 1, */SHOWING: 2, WILL_DISMISS: 3, DISMISSED: 4
}, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'state', [observable], {
    enumerable: true,
    initializer: function () {
        return SystemWarning.STATES.QUEUED;
    }
})), _class);


module.exports = SystemWarning;