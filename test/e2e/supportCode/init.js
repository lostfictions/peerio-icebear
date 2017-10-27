const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('./helpers/appConfig');
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given }) => {
    let app;
    // let username, passphrase;
    let username = 'v9ul3pmbaaxgb0nqsb4sc63pn502ly', passphrase = 'secret secrets';

    Before((testCase, done) => {
        app = getAppInstance();
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            ({ username, passphrase } = data);
        }
        when(() => app.socket.connected, done);
    });

    Given('I am logged in', (done) => {
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
