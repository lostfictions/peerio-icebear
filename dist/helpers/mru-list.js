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

const TinyDb = require('../db/tiny-db');
const _ = require('lodash');
const { observable, action } = require('mobx');
/**
 * Base class for any Most Recently Used implementations.
 * Gotcha: Don't create 2+ instances for the same list name. Due to caching it will lead to conflicts.
 * @param {string} name - unique name for the list
 * @param {number} [limit] - maximum number of elements in the list (will remove least recent)
 * @public
 */
let MRUList = (_dec = observable.shallow, (_class = class MRUList {
  constructor(name, limit = 10) {
    _initDefineProp(this, 'list', _descriptor, this);

    this._saveCache = _.throttle(() => {
      return TinyDb.user.setValue(this._name, this.list.peek());
    }, 3000);

    this._name = `MRU_${name}`;
    this._limit = limit;
  }

  /**
   * Observable list of current MRU list. Readonly.
   * @readonly
   * @member {ObservableArray<string>} list
   * @instance
   * @memberof MRUList
   * @public
   */


  /**
   * Loads cached list from current user's TinyDb.
   * Normally you call this once, after user has been authenticated.
   * In case an instance is created before that, loadCache() is not called automatically.
   * @public
   */
  async loadCache() {
    const list = await TinyDb.user.getValue(this._name);
    if (list) this.list = list;
  }

  /**
   * @private
   */


  /**
   * Adds item usage fact to the list. Saves it to TinyDb in a throttled manner.
   * @function addItem
   * @param {string} item
   * @instance
   * @memberof MRUList
   * @public
   */
  addItem(item) {
    this.list.remove(item);
    this.list.unshift(item);
    this.list.splice(this._limit);
    this._saveCache();
  }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'list', [_dec], {
  enumerable: true,
  initializer: function () {
    return [];
  }
}), _applyDecoratedDescriptor(_class.prototype, 'addItem', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'addItem'), _class.prototype)), _class));


module.exports = MRUList;