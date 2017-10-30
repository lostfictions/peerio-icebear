const getAppInstance = require('./helpers/appConfig');
const { asPromise } = require('../../../src/helpers/prombservable');
const { when } = require('mobx');

const app = getAppInstance();

const waitForConnection = () => {
    return asPromise(app.socket, 'connected', true);
};

const currentUser = () => app.User.current;

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

const getFileStore = () => {
    return app.fileStore;
};

module.exports = {
    waitForConnection,
    currentUser,
    setCurrentUser,
    getFileStore,
    getContactWithName
};
