const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;

    Before(() => {
        app = getNewAppInstance();
    });

    Given('I am a logged in user', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        const expected = 1;
        expected.should.equal(1);

        callback(null, 'done');
    });

    When('I enter a DM type of chat', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'done');
    });

    Then('I see only myself and the other recipient', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'done');
    });
});

