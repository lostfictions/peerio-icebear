const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let found;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Find contact by username
    When('I search for {name}', (name) => {
        found = app.contactStore.getContact(name);
    });

    Then('I receive a contact with the username {name}', (name) => {
        found.username.should.contain(name.toString().toLowerCase());
    });
});
