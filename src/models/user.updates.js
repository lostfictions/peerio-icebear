/**
 * Updates module for User model.
 * @module models/user
 */

// const SharedKegDb = require('./kegs/shared-keg-db');
// const keys = require('../crypto/keys');
// const publicCrypto = require('../crypto/public');
// const signCrypto = require('../crypto/sign');
const socket = require('../network/socket');
// const util = require('../util');

module.exports = function mixUserUpdatesModule() {
    this.subscribeToKegUpdates = () => {
        this._kegsUpdater = this._kegsUpdater || socket.subscribe(socket.APP_EVENTS.kegsUpdate, data => {
            console.log('KEGS UPDATE!!!!!');
            console.log(data);
        });
    };
};
