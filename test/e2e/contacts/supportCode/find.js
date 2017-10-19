const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { receivedEmailInvite } = require('../../helpers');
const runFeature = require('../../helpers/runFeature');
const { getRandomUsername, confirmUserEmail } = require('../../helpers');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let returnedContact;
    let other;
    let registeredUsername, registeredEmail;
    let unregisteredUsername, unregisteredEmail;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Background
    Before({ tag: '@registeredUser', timeout: 10000 }, (testCase, cb) => {
        runFeature('Account creation')
            .then(result => {
                if (result.succeeded) {
                    registeredUsername = result.data.username;
                    registeredEmail = `${registeredUsername}@mailinator.com`;
                    confirmUserEmail(registeredEmail, cb);
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Before('@unregisteredUser', () => {
        console.log('hereio2');
        unregisteredUsername = getRandomUsername();
        unregisteredEmail = `${unregisteredUsername}@mailinator.com`;
    });

    // Scenario: Find contact
    When('I search for {someone}', (someone, done) => {
        if (someone === 'a registered username') {
            other = registeredUsername;
        }
        if (someone === 'a registered email') {
            other = registeredEmail;
        }
        if (someone === 'an unregistered user') {
            other = unregisteredEmail;
        }

        returnedContact = app.contactStore.getContact(other);
        when(() => !returnedContact.loading, done);
    });

    When('the contact exists', () => {
        returnedContact.notFound.should.be.false;
    });

    Then('the contact is added in my contacts', () => {
        app.contactStore.contacts.find(c => c === returnedContact)
            .should.be.ok;
    });


    // Scenario: Send invite email
    When('no profiles are found', () => {
        returnedContact.notFound.should.be.true;
    });

    When('I send an invitation to them', (done) => {
        app.contactStore.invite(other)
            .should.be.fulfilled
            .then(done);
    });

    Then('they are added in my invited contacts', (done) => {
        returnedContact = app.contactStore.getContact(other);
        when(() => !returnedContact.loading, () => {
            app.contactStore
                .invitedContacts
                .find(c => c.email === other)
                .should.be.ok;
            done();
        });
    });

    Then('they should receive an email invitation', () => {
        return receivedEmailInvite(other);
    });


    // Scenario: favorite a contact
    When('I favorite a registered user', (done) => {
        other = registeredUsername;
        app.contactStore
            .addContact(registeredUsername)
            .then(result => {
                result.should.be.true;
                done();
            });
    });

    Then('they will be in my favorite contacts', { timeout: 10000 }, (done) => {
        returnedContact = app.contactStore.getContact(other);
        when(() => returnedContact.isAdded, () => {
            app.contactStore
                .addedContacts
                .find(c => c.username === other)
                .should.be.ok;
            done();
        });
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite them', () => {
        app.contactStore.removeContact(other);
    });

    Then('they will not be in my favorites', { timeout: 10000 }, (done) => {
        returnedContact = app.contactStore.getContact(other);
        when(() => !returnedContact.loading, () => {
            app.contactStore
                .addedContacts
                .should.not.contain(c => c.username === other);
            done();
        });
    });


    // Scenario: Create favorite contact
    When('I invite an unregistered user', (done) => {
        other = unregisteredUsername;
        app.contactStore.invite(unregisteredEmail)
            .should.be.fulfilled
            .then(done);
    });

    When('they sign up', (cb) => {
        runFeature('Create account with username', { username: other })
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
        app.contactStore.removeInvite(unregisteredEmail);
    });
});
