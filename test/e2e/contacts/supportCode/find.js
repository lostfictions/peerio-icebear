const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { receivedEmailInvite } = require('../../helpers');
const runFeature = require('../../helpers/runFeature');
const { getRandomUsername, confirmUserEmail } = require('../../helpers');
const { asPromise } = require('../../../../src/helpers/prombservable');

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

    const assignOtherValue = (someone) => {
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

    Before((testCase, done) => {
        const app = getNewAppInstance();
        store = app.contactStore;
        when(() => app.socket.connected, done);
    });

    // Background
    Before({ tag: '@registeredUser', timeout: 10000 }, (testCase, cb) => {
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
    When('I search for {someone}', (someone) => {
        assignOtherValue(someone);
        contactFromUsername = store.getContact(otherUsername);
        return asPromise(contactFromUsername, 'loading', false);
    });

    When('the contact exists', () => {
        contactFromUsername
            .notFound
            .should.be.false;
    });

    Then('the contact is added in my contacts', () => {
        store
            .contacts
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
        store
            .invite(otherUsername)
            .should.be.fulfilled
            .then(done);
    });

    Then('they are added in my invited contacts', () => {
        contactFromUsername = store.getContact(otherUsername);

        return asPromise(contactFromUsername, 'loading', false)
            .then(() => {
                store
                    .invitedContacts
                    .find(c => c.email === otherUsername)
                    .should.be.ok;
            });
    });

    Then('they should receive an email invitation', () => {
        return receivedEmailInvite(otherUsername);
    });


    // Scenario: favorite a contact
    When('I favorite a registered user', (done) => {
        otherUsername = registeredUsername;
        store
            .addContact(registeredUsername)
            .then(result => {
                result.should.be.true;
                done();
            });
    });

    Then('they will be in my favorite contacts', { timeout: 10000 }, () => {
        contactFromUsername = store.getContact(otherUsername);
        // here test false case
        return asPromise(contactFromUsername, 'isAdded', true)
            .then(() => {
                store
                    .addedContacts
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

        return asPromise(contactFromUsername, 'loading', false)
            .then(() => {
                store
                    .addedContacts
                    .should.not.contain(c => c.username === otherUsername);
            });
    });


    // Scenario: Create favorite contact
    When('I invite an unregistered user', (done) => {
        otherUsername = unregisteredUsername;
        store
            .invite(unregisteredEmail)
            .should.be.fulfilled
            .then(done);
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
