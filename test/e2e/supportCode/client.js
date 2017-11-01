const getAppInstance = require('./helpers/appConfig');
const { asPromise } = require('../../../src/helpers/prombservable');
const { when } = require('mobx');

const app = getAppInstance();

const waitForConnection = () => {
    return asPromise(app.socket, 'connected', true);
};

const showChatUI = () => {
    app.clientApp.isFocused = true;
    app.clientApp.isInChatsView = true;
};

// User
const currentUser = () => app.User.current;

const setCurrentUser = (username, passphrase) => {
    app.User.current = new app.User();
    app.User.current.username = username;
    app.User.current.passphrase = passphrase;
    app.User.current.email = `${username}@mailinator.com`;

    return app.User.current;
};

// Contacts
const getContactWithName = (name) => {
    return new Promise((resolve) => {
        const receiver = new app.Contact(name);
        when(() => !receiver.loading, () => resolve(receiver));
    });
};

const getContactStore = () => {
    return app.contactStore;
};

// Chat
const getChatStore = () => {
    return app.chatStore;
};

const getChatInviteStore = () => {
    return app.chatInviteStore;
};

// Storage
const getFileStore = () => {
    return app.fileStore;
};

module.exports = {
    waitForConnection,
    showChatUI,
    currentUser,
    setCurrentUser,
    getFileStore,
    getContactWithName,
    getContactStore,
    getChatStore,
    getChatInviteStore
};
