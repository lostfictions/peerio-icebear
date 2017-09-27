const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { getRandomUsername } = require('../../helpers');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Account creation
    Given('I am a new customer', () => {
        const user = new app.User();

        user.username = getRandomUsername();
        user.email = 'alice@carroll.com';
        user.passphrase = 'secret secrets';

        app.User.current = user;
    });

    When('I successfully create a new account', () => {
        app.User.current.createAccountAndLogin().should.be.fulfilled;
    });

    Then('I will be logged in', (done) => {
        when(() => app.socket.authenticated, done);
    });

    // Scenario: Sign in
    Given('I am a returning customer', () => {
        const user = new app.User();

        user.username = 'quxa7sbcj5cytq66utkpjasnss32yb';
        user.passphrase = 'secret secrets';

        app.User.current = user;
    });

    When('I sign in', () => {
        app.User.current.login().should.be.fulfilled;
    });

    Then('I have access to my account', (done) => {
        when(() => app.socket.authenticated, done);
    });
});

