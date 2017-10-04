const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const speakeasy = require('speakeasy');
const { getRandomUsername } = require('../../helpers');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let secret = null;
    let blob = null;
    let url = '';

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
            .then(() => {
                console.log(`<peerioData>username: ${app.User.current.username}</peerioData>`);
                console.log(`<peerioData>passphrase: ${app.User.current.passphrase}</peerioData>`);
            })
            .then(done);
    });

    Then('I will be logged in', (done) => {
        when(() => app.socket.authenticated, done);
    });


    // Scenario: Account deletion
    Given('I am a registered user', (done) => {
        const user = new app.User();

        user.username = getRandomUsername();
        user.email = 'alice@carroll.com';
        user.passphrase = 'secret secrets';

        app.User.current = user;

        app.User.current.createAccountAndLogin()
            .should.be.fulfilled
            .then(done);
    });

    When('I delete my account', () => {
        // todo: Account deletion init failed. No confirmed primary e-mail for user
        app.User.current.primaryAddressConfirmed = true;
        return app.User.current.deleteAccount(app.User.current.username);
    });

    Then('I should receive a confirmation', (done) => {
        done(null, 'pending');
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

        return app.User.current.login()
            .then(() => asPromise(app.socket, 'authenticated', true))
            .then(() => asPromise(app.User.current, 'profileLoaded', true));
    });

    When('I sign out', () => {
        return app.User.current.signout(); // isserverWarning_emailConfirmationSent
    });

    Then('I can not access my account', (done) => {
        done(null, 'pending'); // check 2fa
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


    // Scenario: Update display name
    When('I change my display name', () => {
        app.User.current.firstName = 'Alice';
        app.User.current.lastName = 'Carroll';

        return app.User.current.saveProfile();
    });

    Then('it should be updated', () => {
        app.User.current.firstName.should.equal('Alice');
        app.User.current.lastName.should.equal('Carroll');
    });


    // Scenario: Add avatar successfully
    When('I upload an avatar', () => {
        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('it should appear in my profile', () => {
        app.contactStore.getContact(app.User.current.username)
            .hasAvatar
            .should.be.true;
    });


    // Scenario: Add avatar when another one is being loaded
    When('another avatar upload is in progress', () => {
        app.User.current.savingAvatar = true;
        blob = null;
    });

    Then('I should get an error saying {err}', (err) => {
        return app.User.current
            .saveAvatar(blob)
            .should.be.rejectedWith(err);
    });


    // Scenario: Add avatar with wrong number of pictures
    When('the upload does not contain {int} blobs', (int) => {
        blob = { small: '' };
    });


    // Scenario: Add avatar with malformed payload
    When('the payload is malformed', () => {
        blob = ['', ''];
    });


    // Scenario: Update avatar
    Given('I have an avatar', (done) => {
        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled
            .then(() => {
                url = app.contactStore
                    .getContact(app.User.current.username)
                    .largeAvatarUrl;
            })
            .then(done);
    });

    When('I upload a new avatar', () => {
        blob = [new ArrayBuffer(43), new ArrayBuffer(43)];

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('the new avatar should be displayed', () => {
        const newURl = app.contactStore
            .getContact(app.User.current.username)
            .largeAvatarUrl;

        newURl.should.not.equal(url);
    });


    //  Scenario: Remove avatar
    When('I delete my avatar', () => {
        blob = null;

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('my avatar should be empty', () => {
        app.contactStore.getContact(app.User.current.username)
            .hasAvatar
            .should.be.false;
    });


    // Scenario: Enable 2FA
    When('I enable 2FA', (done) => {
        app.User.current.twoFAEnabled = false;

        app.User.current
            .setup2fa()
            .then((s) => { secret = s; })
            .then(done);
    });

    Then('I should receive a challenge', (done) => {
        secret.should.not.be.null;

        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
        });
        console.log(`secret is: ${token}`);

        app.clientApp
            .active2FARequest
            .submit(token, false);

        // app.User.current.confirm2faSetup(token, false)
        //     .then(done);
    });


    // Scenario: Try to enable 2FA when it's already active
    When('2FA is already enabled', () => {
        app.User.current.twoFAEnabled = true;
    });

    Then('I should receive an error saying {err}', (err) => {
        return app.User.current
            .setup2fa()
            .should.be.rejectedWith(err);
    });


    // Scenario: Disable 2FA
    Then('I can disable 2FA', (done) => {
        done(null, 'pending');
        // First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object
        // app.User.current
        //     .disable2fa()
        //     .then(() => {
        //         app.User.current.twoFAEnabled.should.be.true;
        //     })
        //     .then(done);
    });
});

