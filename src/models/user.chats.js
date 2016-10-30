/**
 * Chats module for User model.
 * @module models/user
 */

const SharedKegDb = require('./kegs/shared-keg-db');
// const keys = require('../crypto/keys');
// const publicCrypto = require('../crypto/public');
// const signCrypto = require('../crypto/sign');
const socket = require('../network/socket');
// const util = require('../util');

module.exports = function mixUserChatsModule() {
    this.createChat = () => {
        console.log('Creating chat.');
        const users = [this.username, 'test9x9x9x'];
        const request = {
            participants: users
        };
        return socket.send('/auth/kegs/collection/create-chat', request)
            .then(chat => {
                console.log('Initializing shared keg');
                const sharedKegDb = new SharedKegDb(chat.id, users);
                return sharedKegDb.createBootKeg();
            });
    };
};

