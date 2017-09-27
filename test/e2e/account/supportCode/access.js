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

    When('I successfully create a new account', (done) => {
        app.User.current.createAccountAndLogin()
            .should.be.fulfilled
            .then(done);
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

    When('I sign in', (done) => {
        app.User.current.login()
            .should.be.fulfilled
            .then(done);
    });

    Then('I have access to my account', (done) => {
        when(() => app.socket.authenticated, done);
    });


    // Scenario: Sign out
    Given('I am logged in', () => {
        const user = new app.User();

        user.username = 'quxa7sbcj5cytq66utkpjasnss32yb';
        user.passphrase = 'secret secrets';

        app.User.current = user;

        return app.User.current.login();
    });

    When('I sign out', () => {
        return app.User.current.signout(); // isserverWarning_emailConfirmationSent
    });

    Then('I can not access my account', (done) => {
        done(null, 'pending');
    });


    // Scenario: Add new email
    When('{email} is added in my email addresses', (email, done) => {
        app.User.current
            .addEmail(email)
            .then(done);
    });

    Then('my email addresses should contain {email}', (email, done) => {
        app.User.current
            .login() // todo: have to login to refresh addresses - better way?
            .then(() => {
                app.User.current.addresses
                    .find(x => x.address === email)
                    .should.not.be.null;
            })
            .then(done);
    });


    // Scenario: Remove email
    When('I remove {email}', (email) => {
        return app.User.current.removeEmail(email);
    });

    Then('{email} should not appear in my addresses', (email, done) => {
        app.User.current
            .login() // todo: have to login to refresh addresses - better way?
            .then(() => {
                app.User.current.addresses
                    .includes(x => x.address === email)
                    .should.be.false;
            })
            .then(done);
    });
});

