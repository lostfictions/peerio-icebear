const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

// Scenario: Account creation
defineSupportCode(({ Before, Given, Then, When }) => {
    let app;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

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

    const usernameChars = '0123456789abcdefghijklmnopqrstuvwxyz';
    // generates 16-character random usernames
    function getRandomUsername() {
        let username = '';
        for (let i = 0; i < 30; i++) {
            username += usernameChars[Math.floor(Math.random() * usernameChars.length)];
        }
        return username;
    }
});

