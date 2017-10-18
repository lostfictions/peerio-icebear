const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { receivedEmailInvite } = require('../../helpers');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let found;
    let numberOfContacts;

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

    Then('{someone} is added in my invited contacts', (someone) => {
        app.contactStore.invitedContacts.find(c => c.email === someone)
            .should.be.ok;
    });

    Then('{someone} should receive an email invitation', (someone) => {
        return receivedEmailInvite(someone);
    });


    // Scenario: favorite a contact
    When('I favorite {someone}', (someone, done) => {
        // todo: finish loading 0 contacts
        when(() => app.contactStore.contacts.length > 1, () => {
            numberOfContacts = app.contactStore.addedContacts.length;
            app.contactStore
                .addContact(someone)
                .then(result => {
                    result.should.be.true;
                    done();
                });
        });
    });


    Then('{someone} will be in my favorite contacts', (someone, done) => {
        when(() => app.contactStore.addedContacts.length === numberOfContacts + 1, () => {
            app.contactStore.addedContacts
                .find(c => c.username === someone)
                .should.be.ok;
            done();
        });
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite {someone}', (someone) => {
        app.contactStore.removeContact(someone);
    });

    Then('{someone} will not be in my favorites', (someone, done) => {
        when(() => app.contactStore.addedContacts.length === numberOfContacts, () => {
            app.contactStore.addedContacts.should.not.contain(c => c.username === someone);
            done();
        });
    });


    // Scenario: Create favorite contact
    When('I confirm my email', () => {
    });

    When('they confirm their email', () => {
        // return receivedEmailInvite(found.email);
    });


    // Scenario: Remove favorite contact before email confirmation
    When('{a new user} confirms their email', (callback) => {

    });
});
