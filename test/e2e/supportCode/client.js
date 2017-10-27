const getAppInstance = require('./helpers/appConfig');
const { asPromise } = require('../../../src/helpers/prombservable');

const app = getAppInstance();

const waitForConnection = () => {
    return asPromise(app.socket, 'connected', true);
};

const getFileStore = () => {
    return app.fileStore;
};

module.exports = { waitForConnection, getFileStore };
