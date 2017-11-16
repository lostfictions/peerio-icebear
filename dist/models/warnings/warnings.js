'use strict';

var _dec, _desc, _value, _class, _descriptor;

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

const { observable, action, when, reaction } = require('mobx');
const socket = require('../../network/socket');
const SystemWarning = require('./system-warning');
const ServerWarning = require('./server-warning');
const clientApp = require('../client-app');

/**
 * Public API for Warnings system.
 * @namespace
 * @public
 */
let Warnings = (_dec = action.bound, (_class = class Warnings {

    /**
     * Warnings waiting to get shown.
     * @member {Array<SystemWarning>}
     * @private
     */
    constructor() {
        _initDefineProp(this, 'current', _descriptor, this);

        this.queue = [];
        this.sessionCache = {};

        this.assignNextItem = () => {
            this.current = this.queue.shift();
            if (!this.current) return;
            when(() => this.current.state === SystemWarning.STATES.DISMISSED, () => setTimeout(this.assignNextItem));
            if (this.current.level === 'medium' && clientApp.isFocused) this.current.autoDismiss();
            this.current.show();
        };

        reaction(() => clientApp.isFocused, isFocused => {
            if (!this.current || this.current.level !== 'medium') return;
            if (isFocused) {
                this.current.autoDismiss();
            } else {
                this.current.cancelAutoDismiss();
            }
        });
    }

    /**
     * Adds the warning to internal queue.
     * @param {SystemWarning} warning
     * @private
     */


    /**
     * Some combination of conditions like several reconnects while AFK might create multiple duplicate warnings
     * because server sends them on every reconnect until dismissed.
     * To avoid that we store a cache of unconfirmed server warnings for the session.
     * @private
     */
    queueItem(warning) {
        if (warning.level === 'severe') {
            this.queue.unshift(warning);
        } else {
            this.queue.push(warning);
        }
        if (!this.current) {
            this.assignNextItem();
        }
    }
    /**
     * Pops next item from queue and makes it current.
     * @private
     */


    /**
     * General method to add warnings. More specialized shortcuts are available.
     * Severe warnings will always get added to the top of the queue.
     * @param {string} content - translation key.
     * @param {string} [title] - optional translation key for title, will not be shown in snackbars.
     * @param {Object} [data] - variables to pass to translator.
     * @param {string} [level='medium'] - severity level.
     * @param {function} [callback] - executes when warning is dismissed
     * @function add
     * @instance
     * @memberof Warnings
     * @public
     */
    add(content, title, data, level = 'medium', callback) {
        this.queueItem(new SystemWarning(content, title, data, level, callback));
    }

    /**
     * Shortcut to add severe warnings without specifying severity level explicitly.
     * Severe warnings will always get added to the top of the queue.
     * @param {string} content - translation key.
     * @param {string} [title] - optional translation key for title, will not be shown in snackbars.
     * @param {Object} [data] - variables to pass to translator.
     * @param {function} [callback] - executes when warning is dismissed
     * @function addSevere
     * @instance
     * @memberof Warnings
     * @public
     */
    addSevere(content, title, data, callback) {
        this.add(content, title, data, 'severe', callback);
    }

    /**
     * Adds server warning to the queue.
     * @param {Object} serverObj - as received from server
     * @function addServerWarning
     * @instance
     * @memberof Warnings
     * @protected
     */
    addServerWarning(serverObj) {
        if (serverObj.msg === 'serverWarning_promoConsentRequest') return;
        if (this.sessionCache[serverObj.token]) return;
        this.sessionCache[serverObj.token] = true;
        try {
            const w = new ServerWarning(serverObj, () => {
                delete this.sessionCache[serverObj.token];
            });
            this.queueItem(w);
        } catch (e) {
            console.error(e); // try/catch protects from invalid data sent from server
        }
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'current', [observable], {
    enumerable: true,
    initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'add', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'add'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'addSevere', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'addSevere'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'addServerWarning', [_dec], Object.getOwnPropertyDescriptor(_class.prototype, 'addServerWarning'), _class.prototype)), _class));


const w = new Warnings();

socket.onceStarted(() => socket.subscribe(socket.APP_EVENTS.serverWarning, w.addServerWarning));

module.exports = w;