const defineSupportCode = require('cucumber').defineSupportCode;
const { runFeature, checkResultAnd } = require('./runFeature');
const { assignOtherUserId } = require('./otherUser');
const { waitForConnection, getFileStore } = require('./client');
const { confirmUserEmail } = require('./mailinatorHelper');
const { getRandomUsername } = require('./usernameHelper');

defineSupportCode(({ setDefaultTimeout, defineParameterType, Before }) => {
    setDefaultTimeout(10000);

    defineParameterType({
        regexp: /(Blobs should be of ArrayBuffer type|Blobs array length should be 2|Already saving avatar, wait for it to finish.)/, // eslint-disable-line
        name: 'err'
    });

    Before('@registeredUser', () => {
        return runFeature('Create new account')
            .then(checkResultAnd)
            .then(assignOtherUserId);
    });

    Before('@confirmedUser', () => {
        return runFeature('Create new account')
            .then(checkResultAnd)
            .then(data => {
                assignOtherUserId(data);

                const email = `${data.username}@mailinator.com`;
                return confirmUserEmail(email);
            });
    });

    Before('@unregisteredUser', () => {
        const username = getRandomUsername();
        assignOtherUserId({ username });
    });

    Before({ tags: '@fileStoreLoaded' }, () => {
        const fileStore = getFileStore();
        return waitForConnection().then(fileStore.loadAllFiles);
    });
});
