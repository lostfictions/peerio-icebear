const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('./helpers/appConfig');
const { when } = require('mobx');
const { receivedEmailInvite, confirmUserEmail } = require('./helpers/mailinatorHelper');
const runFeature = require('./helpers/runFeature');
const { getRandomUsername } = require('./helpers/usernameHelper');
const { asPromise } = require('./../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given, Then, When }) => {
    let store;
    let contactFromUsername;
    let otherUsername;
    let registeredUsername, registeredEmail;
    let unregisteredUsername, unregisteredEmail;

    const assignUnregisteredUser = () => {
        unregisteredUsername = getRandomUsername();
        unregisteredEmail = `${unregisteredUsername}@mailinator.com`;
    };

    const assignRegisteredUser = (result) => {
        registeredUsername = result.data.username;
        registeredEmail = `${registeredUsername}@mailinator.com`;
    };

    const assignOtherUsername = (someone) => {
        if (someone === 'a registered username') {
            otherUsername = registeredUsername;
        }
        if (someone === 'a registered email') {
            otherUsername = registeredEmail;
        }
        if (someone === 'an unregistered user') {
            otherUsername = unregisteredEmail;
        }
    };

    const contactLoaded = () => {
        return asPromise(contactFromUsername, 'loading', false);
    };

    Before((testCase, done) => {
        const app = getAppInstance();
        store = app.contactStore;
        when(() => app.socket.connected, done);
    });

    Before({ tag: '@confirmedUser', timeout: 10000 }, (testCase, cb) => {
        runFeature('Account creation')
            .then(result => {
                if (result.succeeded) {
                    assignRegisteredUser(result);
                    confirmUserEmail(registeredEmail, cb);
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Before('@unregisteredUser', () => {
        assignUnregisteredUser();
    });

    // Scenario: Find contact
    Given(/I search for (a registered username|a registered email|an unregistered user)/, (someone) => {
        assignOtherUsername(someone);
        contactFromUsername = store.getContact(otherUsername);
        return contactLoaded();
    });

    When('the contact exists', () => {
        contactFromUsername
            .notFound
            .should.be.false;
    });

    Then('the contact is added in my contacts', () => {
        store.contacts
            .find(c => c === contactFromUsername)
            .should.be.ok;
    });


    // Scenario: Send invite email
    When('no profiles are found', () => {
        contactFromUsername
            .notFound
            .should.be.true;
    });

    When('I send an invitation to them', (done) => {
        store.invite(otherUsername)
            .should.be.fulfilled
            .then(done);
    });

    Then('they are added in my invited contacts', () => {
        contactFromUsername = store.getContact(otherUsername);

        return contactLoaded()
            .then(() => {
                store.invitedContacts
                    .find(c => c.email === otherUsername)
                    .should.be.ok;
            });
    });

    Then('they should receive an email invitation', () => {
        return receivedEmailInvite(otherUsername);
    });


    // Scenario: favorite a contact
    When('I favorite a registered user', () => {
        otherUsername = registeredUsername;
        return store.addContact(registeredUsername)
            .then(result => {
                result.should.be.true;
            });
    });

    Then('they will be in my favorite contacts', { timeout: 10000 }, () => {
        contactFromUsername = store.getContact(otherUsername);

        return asPromise(contactFromUsername, 'isAdded', true)
            .then(() => {
                store.addedContacts
                    .find(c => c.username === otherUsername)
                    .should.be.ok;
            });
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite them', () => {
        store.removeContact(otherUsername);
    });

    Then('they will not be in my favorites', { timeout: 10000 }, () => {
        contactFromUsername = store.getContact(otherUsername);

        return contactLoaded()
            .then(() => {
                store.addedContacts
                    .should.not.contain(c => c.username === otherUsername);
            });
    });


    // Scenario: Create favorite contact
    When('I invite an unregistered user', () => {
        otherUsername = unregisteredUsername;
        return store.invite(unregisteredEmail)
            .should.be.fulfilled;
    });

    When('they sign up', (cb) => {
        runFeature('Create account with username', { username: otherUsername })
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    When('they confirm their email', (done) => {
        confirmUserEmail(unregisteredEmail, done);
    });


    // Scenario: Remove favorite contact before email confirmation
    When('I remove the invitation', () => {
        store.removeInvite(unregisteredEmail);
    });
});
