'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;

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

const Keg = require('../kegs/keg');
const { observable } = require('mobx');

/**
 * Plaintext named system keg, server controlled.
 * User can update this keg, but server verifies contract.
 * @extends {Keg}
 * @param {User} user
 * @public
 */
let Settings = (_class = class Settings extends Keg {
  /**
   * @member {boolean} dataCollection
   * @memberof Settings
   * @instance
   * @public
   */

  /**
   * @member {boolean} messageNotifications
   * @memberof Settings
   * @instance
   * @public
   */
  constructor(user) {
    super('settings', 'settings', user.kegDb, true);

    _initDefineProp(this, 'contactNotifications', _descriptor, this);

    _initDefineProp(this, 'contactRequestNotifications', _descriptor2, this);

    _initDefineProp(this, 'messageNotifications', _descriptor3, this);

    _initDefineProp(this, 'errorTracking', _descriptor4, this);

    _initDefineProp(this, 'dataCollection', _descriptor5, this);

    _initDefineProp(this, 'subscribeToPromoEmails', _descriptor6, this);

    this.user = user;
  }
  /**
   * @member {boolean} subscribeToPromoEmails
   * @memberof Settings
   * @instance
   * @public
   */

  /**
   * @member {boolean} errorTracking
   * @memberof Settings
   * @instance
   * @public
   */

  /**
   * @member {boolean} contactRequestNotifications
   * @memberof Settings
   * @instance
   * @public
   */


  serializeKegPayload() {
    return {
      contactNotifications: this.contactNotifications,
      contactRequestNotifications: this.contactRequestNotifications,
      messageNotifications: this.messageNotifications,
      errorTrackingOptIn: this.errorTracking,
      dataCollectionOptIn: this.dataCollection,
      subscribeToPromoEmails: this.subscribeToPromoEmails
    };
  }

  deserializeKegPayload(data) {
    this.contactNotifications = data.contactNotifications;
    this.contactRequestNotifications = data.contactRequestNotifications;
    this.messageNotifications = data.messageNotifications;
    this.errorTracking = data.errorTrackingOptIn;
    this.dataCollection = data.dataCollectionOptIn;
    this.subscribeToPromoEmails = data.subscribeToPromoEmails;
    this.loaded = true;
  }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'contactNotifications', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'contactRequestNotifications', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'messageNotifications', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'errorTracking', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'dataCollection', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'subscribeToPromoEmails', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
})), _class);


module.exports = Settings;