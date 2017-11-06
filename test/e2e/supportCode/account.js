const defineSupportCode = require('cucumber').defineSupportCode;
const { when } = require('mobx');
const { getRandomUsername } = require('./helpers/usernameHelper');
const { confirmUserEmail } = require('./helpers/mailinatorHelper');
const { runFeature, checkResult } = require('./helpers/runFeature');
const { DisconnectedError } = require('./../../../src/errors');
const { asPromise } = require('../../../src/helpers/prombservable');
const { waitForConnection, waitForAuth, currentUser, setCurrentUser, getContactWithName } = require('./helpers/client');
const { secretPassphrase } = require('./helpers/constants');

defineSupportCode(({ Before, Given, Then, When }) => {
    let secret = null;
    let blob = null;
    let url = '';
    let newEmail;

    let username, passphrase;

    const notifyOfCredentials = () => {
        const data = {
            username: currentUser().username,
            passphrase: currentUser().passphrase
        };
        console.log(`<peerioData>${JSON.stringify(data)}</peerioData>`);
    };

    const setCredentialsIfAny = () => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            ({ username, passphrase } = data);
        }
    };

    Before(() => {
        return waitForConnection()
            .then(setCredentialsIfAny);
    });

    Before('not @helper', (done) => {
        setCurrentUser(getRandomUsername(), secretPassphrase);
        return currentUser()
            .createAccountAndLogin()
            .then(() => asPromise(currentUser(), 'profileLoaded', true))
            .then(() => when(() => currentUser().quota, done));
    });

    Given('I am logged in', (done) => {
        setCurrentUser(username, passphrase);
        return currentUser().login()
            .then(() => asPromise(currentUser(), 'profileLoaded', true))
            .then(() => when(() => currentUser().quota, done));
    });


    // Scenario: Account creation
    When('I successfully create an account', () => {
        return runFeature('Create new user')
            .then(checkResult);
    });

    Given('I am a new customer', () => {
        setCurrentUser(getRandomUsername(), secretPassphrase);
    });

    When('I successfully create a new account', () => {
        return currentUser().createAccountAndLogin()
            .should.be.fulfilled
            .then(notifyOfCredentials);
    });

    Then('I will be logged in', () => {
        return waitForAuth();
    });


    // Scenario: Account deletion
    When('my email is confirmed', () => {
        return confirmUserEmail(currentUser().email)
            .then(() => {
                currentUser().primaryAddressConfirmed = true;
            });
    });

    Given('I delete my account', () => {
        return currentUser().deleteAccount(currentUser().username);
    });

    Then('I should not be able to login', () => {
        return currentUser()
            .login()
            .should.be.rejectedWith(DisconnectedError);
    });


    // Scenario: Sign in
    Given('I am a returning customer', () => {
        setCurrentUser(username, passphrase);
    });

    When('I sign in', () => {
        return currentUser().login()
            .should.be.fulfilled;
    });

    Then('I have access to my account', () => {
        return waitForAuth();
    });


    // Scenario: Sign out
    When('I sign out', () => {
        return currentUser().signout(); // isserverWarning_emailConfirmationSent
    });

    Then('I can not access my account', (done) => {
        done(null, 'pending'); // check 2fa
    });


    // Scenario: Primary email
    When('I add a new email', () => {
        newEmail = `${getRandomUsername()}@mailinator.com`;
        return currentUser().addEmail(newEmail);
    });

    When('the new email is confirmed', () => {
        return confirmUserEmail(newEmail);
    });

    When('I make the new email primary', () => {
        return currentUser().makeEmailPrimary(newEmail);
    });

    Then('the primary email should be updated', () => {
        return currentUser().login()
            .then(() => {
                const primaryAddress = currentUser().addresses.find(x => x.primary);
                primaryAddress.should.not.be.null.and.equal(newEmail);
            });
    });


    // Scenario: Add new email
    Then('new email is in my addresses', () => {
        currentUser().addresses
            .find(x => x.address === newEmail)
            .should.not.be.null;
    });


    // Scenario: Remove email
    When('I remove the new email', () => {
        return currentUser().removeEmail(newEmail);
    });

    Then('the new email should not appear in my addresses', () => {
        currentUser().addresses
            .includes(x => x.address === newEmail)
            .should.be.false;
    });


    // Scenario: Update display name
    When('I change my display name', () => {
        currentUser().firstName = 'Alice';
        currentUser().lastName = 'Carroll';

        return currentUser().saveProfile();
    });

    Then('it should be updated', () => {
        currentUser().firstName.should.equal('Alice');
        currentUser().lastName.should.equal('Carroll');
    });


    // Scenario: Add avatar successfully
    When('I upload an avatar', () => {
        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        return currentUser().saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('it should appear in my profile', () => {
        return getContactWithName(currentUser().username)
            .then(user => user.hasAvatar.should.be.true);
    });


    // Scenario: Add avatar when another one is being loaded
    When('another avatar upload is in progress', () => {
        currentUser().savingAvatar = true;
        blob = null;
    });

    Then('I should get an error saying {err}', (err) => {
        return currentUser().saveAvatar(blob)
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
    Given('I have an avatar', () => {
        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        return currentUser().saveAvatar(blob)
            .should.be.fulfilled
            .then(() => {
                return getContactWithName(currentUser().username)
                    .then(user => { url = user.largeAvatarUrl; });
            });
    });

    When('I upload a new avatar', () => {
        blob = [new ArrayBuffer(43), new ArrayBuffer(43)];

        return currentUser().saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('the new avatar should be displayed', () => {
        return getContactWithName(currentUser().username)
            .then(user => user.largeAvatarUrl.should.not.equal(url));
    });


    //  Scenario: Remove avatar
    When('I delete my avatar', () => {
        blob = null;

        return currentUser().saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('my avatar should be empty', () => {
        return getContactWithName(currentUser().username)
            .then(user => user.hasAvatar.should.be.false);
    });


    // Scenario: Enable 2FA
    When('I enable 2FA', (done) => {
        currentUser().twoFAEnabled = false;

        currentUser()
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
        currentUser().twoFAEnabled = true;
    });

    Then('I should receive an error saying {string}', (err) => {
        return currentUser()
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

    // Helpers
    Then('Create account with username', (done) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            username = data.username;
        } else {
            done(null, 'failed');
        }

        setCurrentUser(username, secretPassphrase);
        currentUser().createAccountAndLogin()
            .should.be.fulfilled
            .then(done);
    });

    Given('Create new account', () => {
        setCurrentUser(getRandomUsername(), secretPassphrase);
        return currentUser()
            .createAccountAndLogin()
            .should.be.fulfilled
            .then(notifyOfCredentials);
    });
});
