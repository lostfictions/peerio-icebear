/**
 * Makes it look like there's an authenticated user in current session
 */

const keys = require('../../src/crypto/keys');


function mockCurrentUser() {
    const socket = require('../../src').socket;
    socket.__responseMocks['/auth/kegs/create'] = [function() {
        return {
            id: 1,
            version: 1,
            collectionVersion: 1
        };
    }];
    socket.__responseMocks['/auth/kegs/update'] = [function() {
        return { collectionVersion: 2 };
    }];

    const User = require('../../src/models/user/user');
    const user = new User();
    user.username = 'currenttestuser';
    user.authSalt = keys.generateAuthSalt();
    user.signKeys = keys.generateSigningKeyPair();
    user.encryptionKeys = keys.generateEncryptionKeyPair();
    user.overrideKey = keys.generateEncryptionKey();
    user.bootKey = keys.generateEncryptionKeyPair();
    user.authKeys = keys.generateEncryptionKeyPair();
    User.current = user;
    user.kegDb.createBootKeg(user.bootKey, user.signKeys,
        user.encryptionKeys, user.overrideKey);
}

module.exports = mockCurrentUser;
