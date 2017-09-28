const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });


    // Scenario: Update display name
    When('I change my display name', () => {
        app.User.current.firstName = 'Alice';
        app.User.current.lastName = 'Carroll';

        return app.User.current.saveProfile(); // Invalid increment of the keg version
    });

    Then('it should be updated', () => {
        app.User.current.firstName.should.be('Alice');
        app.User.current.lastName.should.be('Carroll');
    });


    // Scenario: Add avatar successfully
    When('I upload an avatar', (callback) => {
        callback(null, 'pending');
    });

    Then('it should appear in my profile', (callback) => {
        callback(null, 'pending');
    });


    // Scenario: Add avatar when another one is being loaded
    When('another avatar upload is in progress', (callback) => {
        callback(null, 'pending');
    });

    Then('I should get an error saying {err}', (err, callback) => {
        callback(null, 'pending');
    });


    // Scenario: Add avatar with wrong number of pictures
    When('the upload does not contain {int} blobs', (int, callback) => {
        callback(null, 'pending');
    });


    // Scenario: Add avatar with malformed payload
    When('the payload is malformed', (callback) => {
        callback(null, 'pending');
    });


    // Scenario: Update avatar
    When('I change my existing avatar', (callback) => {
        callback(null, 'pending');
    });

    Then('the newly uploaded avatar should appear in my profile', (callback) => {
        callback(null, 'pending');
    });


    //  Scenario: Remove avatar
    When('I change my delete avatar', (callback) => {
        callback(null, 'pending');
    });

    Then('a default photo should appear in my profile', (callback) => {
        callback(null, 'pending');
    });
});
