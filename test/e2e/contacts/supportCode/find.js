const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { receivedEmailInvite } = require('../../helpers');
const runFeature = require('../../helpers/runFeature');
const { getRandomUsername, confirmUserEmail } = require('../../helpers');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let found;
    let other;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Find contact
    When('I search for {someone}', (someone, done) => {
        found = app.contactStore.getContact(someone);
        when(() => !found.loading, done);
    });

    When('the contact exists', () => {
        found.notFound.should.be.false;
    });

    Then('the contact is added in my contacts', () => {
        app.contactStore.contacts.find(c => c === found)
            .should.be.ok;
    });


    // Scenario: Send invite email
    When('no profiles are found', () => {
        found.notFound.should.be.true;
    });

    When('I send an invitation to {someone}', (someone, done) => {
        app.contactStore.invite(someone)
            .should.be.fulfilled
            .then(done);
    });

    Then('{someone} is added in my invited contacts', (someone, done) => {

        found = app.contactStore.getContact(someone);
        when(() => !found.loading, () => {
            app.contactStore
                .invitedContacts
                .find(c => c.email === someone)
                .should.be.ok;
            done();
        });
    });

    Then('{someone} should receive an email invitation', (someone) => {
        return receivedEmailInvite(someone);
    });


    // Scenario: favorite a contact
    When('I favorite {someone}', (someone, done) => {
        app.contactStore
            .addContact(someone)
            .then(result => {
                result.should.be.true;
                done();
            });
    });

    Then('{someone} will be in my favorite contacts', { timeout: 10000 }, (someone, done) => {
        // this definition matches 2 steps
        if (someone === 'they') { someone = other; } // eslint-disable-line

        found = app.contactStore.getContact(someone);
        when(() => found.isAdded, () => {
            app.contactStore
                .addedContacts
                .find(c => c.username === someone)
                .should.be.ok;
            done();
        });
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite {someone}', (someone) => {
        app.contactStore.removeContact(someone);
    });

    Then('{someone} will not be in my favorites', { timeout: 10000 }, (someone, done) => {
        // this definition matches 2 steps
        if (someone === 'they') { someone = other; } // eslint-disable-line

        found = app.contactStore.getContact(someone);
        when(() => !found.loading, () => {
            app.contactStore
                .addedContacts
                .should.not.contain(c => c.username === someone);
            done();
        });
    });


    // Scenario: Create favorite contact
    When('I invite a new user', (done) => {
        other = getRandomUsername();
        app.contactStore.invite(`${other}@mailinator.com`)
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
        confirmUserEmail(`${other}@mailinator.com`, done);
    });


    // Scenario: Remove favorite contact before email confirmation
    When('I remove the invitation', () => {
        app.contactStore.removeInvite(`${other}@mailinator.com`);
    });
});
