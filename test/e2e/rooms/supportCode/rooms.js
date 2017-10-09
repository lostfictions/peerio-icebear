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
        console.log(app.User.current.channelsLeft); 
        
        chat = app.chatStore.startChat([invited], true, roomName, roomPurpose);
        console.log(chat); // TypeError: Cannot read property 'added' of null
    });

    Then('I can enter the room', (done) => {
        when(() => chat.added === true, done);
    });

    // Scenario: Delete room
    Given('I am an admin of {a room}', (callback) => {
        chat = app.chatStore.startChat(invitedUserId, true, roomName, 'test-purpose');
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

    // Scenario: Can not create more than 3 rooms
    When('I created 3 rooms', () => {
        const invited = new app.Contact(invitedUserId, {}, true);
        console.log(app.User.current.channelsLeft); // 0

        chat = app.chatStore.startChat([invited], true, roomName, roomPurpose);
        console.log(chat); // TypeError: Cannot read property 'added' of null
    });
});
