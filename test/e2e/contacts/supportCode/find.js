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

    // Scenario: Find contact by username
    When('I search for {someone}', (someone, done) => {
        found = app.contactStore.getContact(someone);
        when(() => !found.loading, done);
    });

    When('the contact exists', () => {
        found.notFound.should.be.false;
    });

    Then('the contact is added in my favourite contacts', () => {
        app.contactStore.contacts.find(c => c === found);
    });
});
