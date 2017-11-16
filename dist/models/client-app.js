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

const { observable, computed } = require('mobx');
const socket = require('../network/socket');
const { getChatStore } = require('../helpers/di-chat-store');
const { getFileStore } = require('../helpers/di-file-store');
const tracker = require('./update-tracker');
/**
 * This is the place where Icebear can get various state information about client
 * and client can provide such information.
 * Also works as container for high level properties we couldn't find better place for.
 * @namespace ClientApp
 * @public
 */
let ClientApp = (_class = class ClientApp {
  constructor() {
    _initDefineProp(this, 'isFocused', _descriptor, this);

    _initDefineProp(this, 'isInChatsView', _descriptor2, this);

    _initDefineProp(this, 'isInFilesView', _descriptor3, this);

    _initDefineProp(this, 'clientVersionDeprecated', _descriptor4, this);

    _initDefineProp(this, 'active2FARequest', _descriptor5, this);

    _initDefineProp(this, 'uiUserPrefs', _descriptor6, this);
  }

  /**
   * Use this to let Icebear know if your app is currently showing any of the chats.
   * @member {boolean} isInChatsView
   * @memberof ClientApp
   * @public
   */


  /**
   * Use this to let Icebear know if your app is currently showing main file view.
   * @member {boolean} isInFilesView
   * @memberof ClientApp
   * @public
   */


  /**
   * Icebear sets this flag.
   * @member {boolean} clientVersionDeprecated
   * @memberof ClientApp
   * @public
   */


  /**
   * UI should listen to this and request entering of 2fa code from user and then pass ot back to icebear.
   * @member {TwoFARequest} active2FARequest
   * @memberof ClientApp
   * @public
   */


  /**
   * UI should inject observable pref object in here,
   * expected properties:
   *   limitInlineImageSize: bool
   *   externalContentConsented: bool
   *   externalContentEnabled: bool
   *   externalContentJustForFavs: bool,
   *   peerioContentEnabled: bool
   * @memberof ClientApp
   */


  /**
   * UI should listen to this and request entering of 2fa code from user and then pass ot back to icebear.
   * @member {TwoFARequest} updatingAfterReconnect
   * @memberof ClientApp
   * @public
   */
  get updatingAfterReconnect() {
    return socket.connected && !(getChatStore().updatedAfterReconnect && getFileStore().updatedAfterReconnect && tracker.updatedAfterReconnect);
  }

  /**
   * Creates new 2fa request for UI. UI is supposed to show 2fa dialog to user and pass entered code back to icebear.
   * @param {string} type - 'login', 'backupCodes', 'disable' one of the reasons for 2fa request
   * @param {Function<string, ?boolean>} submitCallback, accepts 2fa code and 'trust this device' flag(for login only)
   * @param {?Function} cancelCallback
   * @protected
   */
  create2FARequest(type, submitCallback, cancelCallback) {
    if (!['login', 'backupCodes', 'disable'].includes(type)) {
      throw new Error('Unknown 2fa request type: ', type);
    }
    // deliberately overwriting existing request
    // this should never happen anyway, if it does - it's safer to overwrite
    this.active2FARequest = {
      type,
      submit: (code, trust) => {
        this.active2FARequest = null;
        submitCallback(code, trust);
      },
      cancel: () => {
        this.active2FARequest = null;
        cancelCallback();
      }

    };
  }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'isFocused', [observable], {
  enumerable: true,
  initializer: function () {
    return true;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'isInChatsView', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'isInFilesView', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'clientVersionDeprecated', [observable], {
  enumerable: true,
  initializer: function () {
    return false;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'active2FARequest', [observable], {
  enumerable: true,
  initializer: function () {
    return null;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'uiUserPrefs', [observable], {
  enumerable: true,
  initializer: function () {
    return {};
  }
}), _applyDecoratedDescriptor(_class.prototype, 'updatingAfterReconnect', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'updatingAfterReconnect'), _class.prototype)), _class);


module.exports = new ClientApp();