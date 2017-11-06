const getAppInstance = require('./appConfig');
const { asPromise } = require('../../../../src/helpers/prombservable');
const { when } = require('mobx');

const app = getAppInstance();

const waitForConnection = () => asPromise(app.socket, 'connected', true);
const waitForAuth = () => asPromise(app.socket, 'authenticated', true);
const currentUser = () => app.User.current;
const getContactStore = () => app.contactStore;
const getChatStore = () => app.chatStore;
const getChatInviteStore = () => app.chatInviteStore;
const getFileStore = () => app.fileStore;

const setCurrentUser = (username, passphrase) => {
    app.User.current = new app.User();
    app.User.current.username = username;
    app.User.current.passphrase = passphrase;
    app.User.current.email = `${username}@mailinator.com`;

    return app.User.current;
};

const getContactWithName = (name) => {
    return new Promise((resolve) => {
        const receiver = new app.Contact(name);
        when(() => !receiver.loading, () => resolve(receiver));
    });
};

const showChatUI = () => {
    app.clientApp.isFocused = true;
    app.clientApp.isInChatsView = true;
};

module.exports = {
    waitForConnection,
    waitForAuth,
    showChatUI,
    currentUser,
    setCurrentUser,
    getFileStore,
    getContactWithName,
    getContactStore,
    getChatStore,
    getChatInviteStore
};
