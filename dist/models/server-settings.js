'use strict';

var _dec, _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4;

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

/**
 * Some client configuration details can't be hardcoded to clients or stored in every user database.
 * This module takes care of these settings by loading them from server every time client connects.
 * There's no need for 'updated' events from server because when these settings change server always resets connection.
 * @namespace ServerSettings
 * @public
 */
const socket = require('../network/socket');
const { observable, reaction } = require('mobx');
const { retryUntilSuccess } = require('../helpers/retry');

let ServerSettings = (_dec = observable.ref, (_class = class ServerSettings {
  /**
   * Observable git tag for this server build
   * @member {string} tag
   * @memberof ServerSettings
   * @public
   */
  constructor() {
    _initDefineProp(this, 'avatarServer', _descriptor, this);

    _initDefineProp(this, 'acceptableClientVersions', _descriptor2, this);

    _initDefineProp(this, 'tag', _descriptor3, this);

    _initDefineProp(this, 'maintenanceWindow', _descriptor4, this);

    reaction(() => socket.authenticated, authenticated => {
      if (authenticated) this.loadSettings();
    }, true);
  }
  /**
   * (Re)loads server settings from server.
   * @memberof ServerSettings
   * @private
   */


  /**
   * Observable array of timestamps for maintenance begin and end, if applicable.
   * @member {Array} downtimeMaintenance
   * @memberof ServerSettings
   * @public
   */

  /**
   * Observable client version range this server can work with.
   * @member {string} acceptableClientVersions
   * @memberof ServerSettings
   * @public
   */
  loadSettings() {
    retryUntilSuccess(() => {
      return socket.send('/auth/server/settings').then(res => {
        this.avatarServer = res.fileBaseUrl;
        this.acceptableClientVersions = res.acceptsClientVersions;
        this.tag = res.tag;
        this.maintenanceWindow = res.maintenance;
        console.log('Server settings retrieved.', this.tag, this.avatarServer, this.acceptableClientVersions, this.maintenanceWindow);
      });
    }, 'Server Settings Load');
  }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'avatarServer', [observable], {
  enumerable: true,
  initializer: function () {
    return '';
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'acceptableClientVersions', [_dec], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'tag', [observable], {
  enumerable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'maintenanceWindow', [observable], {
  enumerable: true,
  initializer: null
})), _class));


module.exports = new ServerSettings();