const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    const roomName = 'test-room';
    let invitedUser;
    let chat;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Create room
    When('I create a room', () => {
        invitedUser = new app.Contact('do38j9ncwji7frf48g4jew9vd3f17p');
        
        chat = app.chatStore.startChat(invitedUser, true, roomName, 'test-purpose');
        console.log(chat); // TypeError: Cannot read property 'added' of null
    });

    Then('I can enter the room', (done) => {
        when(() => chat.added === true, done);
    });

    // Scenario: Delete room
    Given('I am an admin of {a room}', (callback) => {
        chat = app.chatStore.startChat(invitedUser, true, roomName, 'test-purpose');
        when(() => chat.added === true, () => {
            // console.log('can i admin '+chat.canIAdmin);
            callback(null, 'pending');
        });
    });

    When('I delete {a room}', (callback) => {
        chat.delete();
        callback(null, 'pending');
    });

    Then('nobody should be able to access {a room}', (callback) => {
        callback(null, 'pending');
    });
});
