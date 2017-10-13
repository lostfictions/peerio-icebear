const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { receivedEmailInvite } = require('../../helpers');

defineSupportCode(({ Before, Then, When }) => {
    let app;
    let found;

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


    //     Scenario Outline: Filters
    When('{joined} and {invited} are my contacts', (joined, invited) => {
    });

    When('{invited} has not joined yet', (invited) => {
    });

    When('I set the filter to {filter}', (filter) => {
    });

    When('{outcome} should appear in my contact list', (outcome) => {
    });


    // Scenario: Create favourite contact
    When('I confirm my email', () => {
    });

    When('they confirm their email', () => {
        return receivedEmailInvite(found.email);
    });


    // Scenario: Remove favourite contact before email confirmation
    When('{a new user} confirms their email', (callback) => {

    });


    // Scenario: Favourite a contact
    When('I favourite {someone}', (someone, done) => {
        found = app.contactStore.addContact(someone);
        when(() => !found.loading, done);
    });


    Then('they will be in my favorite contacts', (callback) => {
        app.contactStore.addedContacts.find(c => c === found)
            .should.be.ok;
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite them', (someone, done) => {
        found = app.contactStore.removeContact(someone);
        when(() => !found.loading, done);
    });

    Then('they will not be in my favorites', (callback) => {
        app.contactStore.addedContacts.find(c => c === found)
            .should.be.undefined;
    });
});
