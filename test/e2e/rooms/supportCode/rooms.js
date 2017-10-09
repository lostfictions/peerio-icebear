const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    const roomName = 'test-room';
    const roomPurpose = 'test-room';
    const invitedUserId = 'do38j9ncwji7frf48g4jew9vd3f17p';
    let chat;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Create room
    When('I create a room', () => {
        const invited = new app.Contact(invitedUserId, {}, true);
        chat = app.chatStore.startChat([invited], true, roomName, roomPurpose);
    });

    Then('I can enter the room', (done) => {
        when(() => chat.added === true, done);
    });

    // Scenario: Delete room
    Given('I am an admin of {a room}', (done) => {
        const invited = new app.Contact(invitedUserId, {}, true);
        chat = app.chatStore.startChat([invited], true, roomName, roomPurpose);
        when(() => chat.canIAdmin === true, done);
    });

    When('I delete a room', () => {
        chat.delete();
    });

    Then('nobody should be able to access {a room}', (callback) => {
        callback(null, 'pending');
    });

    When('I invite {other users}', (callback) => {
        callback(null, 'pending');
    });

    Then('{other users} should get notified', (callback) => {
        callback(null, 'pending');
    });

    Given('{person} has joined {a room}', (callback) => {
        callback(null, 'pending');
    });

    When('I kick out {person}', (callback) => {
        callback(null, 'pending');
    });


    Then('{person} should not be able to access {a room}', (callback) => {
        callback(null, 'pending');
    });

    Given('{person} has joined {a room}', (callback) => {
        callback(null, 'pending');
    });

    When('I promote {person} to role {stringInDoubleQuotes}', (stringInDoubleQuotes, callback) => {
        callback(null, 'pending');
    });

    Then('{person} should be admin', (callback) => {
        callback(null, 'pending');
    });

    Given('{person} has joined {a room}', (callback) => {
        callback(null, 'pending');
    });

    Given('{person} is admin of {a room}', (callback) => {
        callback(null, 'pending');
    });

    When('I demote them', (callback) => {
        callback(null, 'pending');
    });

    Then('{person} should no longer be admin of {a room}', (callback) => {
        callback(null, 'pending');
    });


    // Scenario: Can not create more than 3 rooms
    When('I created 3 rooms', () => {
        const invited = new app.Contact(invitedUserId, {}, true);
        console.log(app.User.current.channelsLeft); // 0

        chat = app.chatStore.startChat([invited], true, roomName, roomPurpose);
        console.log(chat); // TypeError: Cannot read property 'added' of null
    });
});
