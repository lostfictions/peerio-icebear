const defineSupportCode = require('cucumber').defineSupportCode;
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');
const { waitForConnection } = require('./client');
const getAppInstance = require('./helpers/appConfig');

defineSupportCode(({ Before, Given }) => {
    // let username, passphrase;
    let username = 'v9ul3pmbaaxgb0nqsb4sc63pn502ly', passphrase = 'secret secrets';

    Before(() => {
        return waitForConnection()
            .then(() => {
                if (process.env.peerioData) {
                    const data = JSON.parse(process.env.peerioData);
                    ({ username, passphrase } = data);
                }
            });
    });

    Given('I am logged in', (done) => {
        const app = getAppInstance();
        const user = new app.User();

        user.username = username;
        user.passphrase = passphrase;

        app.User.current = user;

        app.User.current.login()
            .then(() => asPromise(app.socket, 'authenticated', true))
            .then(() => asPromise(app.User.current, 'profileLoaded', true))
            .then(() => asPromise(app.fileStore, 'loading', false))
            .then(() => when(() => app.User.current.quota, done));
    });
});
