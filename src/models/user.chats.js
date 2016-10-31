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
    this.createChat = (userTo) => {
        console.log('Creating chat.');
        const users = [this.username, userTo];
        const request = {
            participants: users
        };
        return socket.send('/auth/kegs/collection/create-chat', request)
            .then(chat => {
                console.log('Initializing shared keg');
                const sharedKegDb = new SharedKegDb(chat.id, users);
                return sharedKegDb.createBootKeg()
                    .then(bootKeg => {
                        console.log(bootKeg);
                        return sharedKegDb;
                    });
            });
    };
};

