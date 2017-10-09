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
        // invitedUser = new app.Contact('do38j9ncwji7frf48g4jew9vd3f17p');
        when(() => app.socket.connected, done);
    });

    // Scenario: Create room
    When('I create a room', () => {
        chat = app.chatStore.startChat(invitedUser, true, roomName, 'test-purpose');
    });

    Then('I can enter the room', (done) => {
        when(() => chat.added === true, done);
    });
});
