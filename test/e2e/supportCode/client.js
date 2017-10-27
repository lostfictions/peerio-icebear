const getAppInstance = require('./helpers/appConfig');
const { asPromise } = require('../../../src/helpers/prombservable');
const { when } = require('mobx');

const app = getAppInstance();

const waitForConnection = () => {
    return asPromise(app.socket, 'connected', true);
};

const getFileStore = () => {
    return app.fileStore;
};

const getContactWithName = (name) => {
    return new Promise((resolve) => {
        const receiver = new app.Contact(name);
        when(() => !receiver.loading, () => resolve(receiver));
    });
};

module.exports = {
    waitForConnection,
    getFileStore,
    getContactWithName
};
