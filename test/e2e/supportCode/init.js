const defineSupportCode = require('cucumber').defineSupportCode;
const { runFeature, checkResultAnd } = require('./helpers/runFeature');
const { assignRegisteredUser } = require('./helpers/otherUser');
const { getChatStore, currentUser, waitForConnection, getFileStore } = require('./client');
const { confirmUserEmail } = require('./helpers/mailinatorHelper');
const { getRandomUsername } = require('./helpers/usernameHelper');

defineSupportCode(({ setDefaultTimeout, defineParameterType, Before, After }) => {
    setDefaultTimeout(10000);

    defineParameterType({
        regexp: /(Blobs should be of ArrayBuffer type|Blobs array length should be 2|Already saving avatar, wait for it to finish.)/, // eslint-disable-line
        name: 'err'
    });

    Before('@registeredUser', () => {
        return runFeature('Account creation')
            .then(checkResultAnd)
            .then(assignRegisteredUser);
    });

    Before('@confirmedUser', () => {
        return runFeature('Account creation')
            .then(checkResultAnd)
            .then(data => {
                assignRegisteredUser(data);

                const email = `${data.username}@mailinator.com`;
                return confirmUserEmail(email);
            });
    });

    Before('@unregisteredUser', () => {
        const username = getRandomUsername();
        assignRegisteredUser({ username });
    });

    Before({ tags: '@fileStoreLoaded' }, () => {
        const fileStore = getFileStore();
        return waitForConnection().then(fileStore.loadAllFiles);
    });

    After('@rooms', () => {
        const chatStore = getChatStore();
        return Promise.each(chatStore.chats, chat => {
            if (chat.canIAdmin && chat.isChannel) {
                return chat.delete();
            }
            return Promise.resolve();
        }).then(() => {
            console.log(`---Channels left: ${currentUser().channelsLeft}`);
        });
    });
});
