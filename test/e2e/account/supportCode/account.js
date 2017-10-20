const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('../../helpers/appConfig');
const { when } = require('mobx');
const { getRandomUsername } = require('../../helpers/usernameHelper');
const { confirmUserEmail } = require('../../helpers/runFeature');
const runFeature = require('../../helpers/runFeature');
const { asPromise } = require('../../../../src/helpers/prombservable');
const { DisconnectedError } = require('../../../../src/errors');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let username, passphrase;
    let secret = null;
    let blob = null;
    let url = '';
    let newEmail;

    Before((testCase, done) => {
        app = getAppInstance();
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            ({ username, passphrase } = data);
        }
        when(() => app.socket.connected, done);
    });


    // Scenario: Account creation
    When('I successfully create an account', (cb) => {
        runFeature('Account creation')
            .then(result => {
                if (result.succeeded) {
                    ({ username, passphrase } = result.data);
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Given('I am a new customer', () => {
        const user = new app.User();

        const name = getRandomUsername();
        user.username = name;
        user.email = `${name}@mailinator.com`;
        user.passphrase = 'secret secrets';

        app.User.current = user;
    });

    When('I successfully create a new account', (done) => {
        app.User.current.createAccountAndLogin()
            .should.be.fulfilled
            .then(() => {
                const data = {
                    username: app.User.current.username,
                    passphrase: app.User.current.passphrase
                };
                console.log(`<peerioData>${JSON.stringify(data)}</peerioData>`);
            })
            .then(done);
    });

    Then('I will be logged in', (done) => {
        when(() => app.socket.authenticated, done);
    });


    // Scenario: Account deletion
    When('my email is confirmed', (done) => {
        confirmUserEmail(app.User.current.username,
            () => {
                app.User.current.primaryAddressConfirmed = true;
                done();
            });
    });

    Given('I delete my account', () => {
        return app.User.current.deleteAccount(username);
    });

    Then('I should not be able to login', () => {
        return app.User.current
            .login()
            .should.be.rejectedWith(DisconnectedError);
    });


    // Scenario: Sign in
    Given('I am a returning customer', () => {
        const user = new app.User();

        user.username = username;
        user.passphrase = passphrase;

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

    When('I sign out', () => {
        return app.User.current.signout(); // isserverWarning_emailConfirmationSent
    });

    Then('I can not access my account', (done) => {
        done(null, 'pending'); // check 2fa
    });


    // Scenario: Primary email
    When('Change primary email', { timeout: 10000 }, (cb) => {
        runFeature('Change primary email', { username, passphrase })
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    When('I add a new email', (done) => {
        newEmail = `${getRandomUsername()}@mailinator.com`;
        app.User.current.addEmail(newEmail).then(done);
    });

    When('the new email is confirmed', (done) => {
        confirmUserEmail(newEmail, done);
    });

    When('I make the new email primary', () => {
        return app.User.current.makeEmailPrimary(newEmail);
    });

    Then('the primary email should be updated', (done) => {
        app.User.current.login()
            .then(() => {
                const primaryAddress = app.User.current.addresses.find(x => x.primary);
                primaryAddress.should.not.be.null.and.equal(newEmail);
            })
            .then(done);
    });


    // Scenario: Add new email
    Then('new email is in my addresses', () => {
        app.User.current.addresses
            .find(x => x.address === newEmail)
            .should.not.be.null;
    });


    // Scenario: Remove email
    When('I remove the new email', () => {
        return app.User.current.removeEmail(newEmail);
    });

    Then('the new email should not appear in my addresses', () => {
        app.User.current.addresses
            .includes(x => x.address === newEmail)
            .should.be.false;
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
    When('the upload does not contain 2 blobs', () => {
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

    Then('I should receive a challenge', () => {
        secret.should.not.be.null;

        // const token = speakeasy.totp({
        //     secret: secret.base32,
        //     encoding: 'base32'
        // });
        // console.log(`secret is: ${token}`);

        // app.clientApp
        //     .active2FARequest
        //     .submit(token, false);

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

    // Helper
    Then('Create account with username', (done) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            username = data.username;
        } else {
            done(null, 'failed');
        }

        const user = new app.User();
        user.username = username;
        user.email = `${username}@mailinator.com`;
        user.passphrase = 'secret secrets';

        app.User.current = user;

        app.User.current.createAccountAndLogin()
            .should.be.fulfilled
            .then(done);
    });
});

