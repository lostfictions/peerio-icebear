/**
 * Updates module for User model.
 * @module models/user
 */

const KegDbStore = require('./kegs/keg-db-store');
// const keys = require('../crypto/keys');
// const publicCrypto = require('../crypto/public');
// const signCrypto = require('../crypto/sign');
const socket = require('../network/socket');
// const util = require('../util');

module.exports = function mixUserUpdatesModule() {
    this.subscribeToKegUpdates = () => {
        this._kegsUpdater = this._kegsUpdater || socket.subscribe(socket.APP_EVENTS.kegsUpdate, data => {
            console.log('KEGS UPDATE!!!!!');
            // console.log(data);
            if (data.kegDbId) {
                KegDbStore.update(data.kegDbId, data);
            } else {
                console.error('Unknown kegs update event type');
            }
        });
    };
};
