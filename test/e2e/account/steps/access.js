const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');

// Scenario: Account creation
defineSupportCode(({ Before, Given, Then, When }) => {
    let app;

    Before(() => {
        app = getNewAppInstance();
    });

    Given('I\'m a new customer', (callback) => {
        // setTimeout(() => {
        //     console.log(`open?: ${app.socket.connected}`);
        //     callback(null, 'done');
        // }, 300);

        const user = new app.User();

        user.username = 'alice';
        user.email = 'alice@carroll.com';
        user.passphrase = 'secret secrets';

        app.User.current = user;
        // console.log(`open?: ${app.socket.connected}`);
    });

    When('I create a new account', () => {
        app.User.current.createAccountAndLogin()
            .then(() => console.log('created'))
            .catch((message) => console.log(message));
    });

    Then('I receive a username and passcode', (callback) => {
        callback(null, 'done');
    });
});

