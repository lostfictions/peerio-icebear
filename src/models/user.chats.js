  /**
 * Chats module for User model.
 * @module models/user
 */

const ChatKegDb = require('./kegs/chat-keg-db');
// const keys = require('../crypto/keys');
// const publicCrypto = require('../crypto/public');
// const signCrypto = require('../crypto/sign');
const socket = require('../network/socket');
// const util = require('../util');

module.exports = function mixUserChatsModule() {
    this.createChat = (usernames) => {
        // todo: lookup public keys
        console.log('Creating chat.');
        // ChatKegDb.getChatKegDb(..)
    };
};

