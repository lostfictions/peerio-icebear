const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

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
    // Scenario: Favourite a contact
    When('I favourite {someone}', (someone, done) => {
        found = app.contactStore.addContact(someone);
        when(() => !found.loading, done);
    });


    Then('their name will appear in my favorite contacts', (callback) => {
        app.contactStore.addedContacts.find(c => c === found)
            .should.be.ok;
    });


    // Scenario: Unfavourite a contact
    When('I unfavourite {someone}', (someone, done) => {
        found = app.contactStore.removeContact(someone);
        when(() => !found.loading, done);
    });

    Then('their name be removed from my favorite contacts', (callback) => {
        app.contactStore.addedContacts.find(c => c === found)
            .should.be.undefined;
    });
});
