const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('../../helpers/appConfig');
const { when } = require('mobx');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given, Then, When }) => {
    const app = getAppInstance();
    const store = app.chatStore;
    const roomName = 'test-room';
    const roomPurpose = 'test-room';
    const invitedUserId = 'do38j9ncwji7frf48g4jew9vd3f17p';
    let chat;

    Before((testCase, done) => {
        when(() => app.socket.connected, done);
    });

    // Scenario: Create room
    When('I create a room', () => {
        console.log(`Channels left: ${app.User.current.channelsLeft}`);

        const invited = new app.Contact(invitedUserId, {}, true);
        chat = store.startChat([invited], true, roomName, roomPurpose);
    });

    Then('I can enter the room', (done) => {
        when(() => chat.added === true, done);
    });

    Then('I can rename the room', () => {
        const newChatName = 'superhero-hq';
        chat.rename(newChatName);

        return asPromise(chat, 'name', newChatName);
    });


    Then('I can change the room purpose', () => {
        const newChatPurpose = 'discuss superhero business';
        chat.changePurpose(newChatPurpose);

        return asPromise(chat, 'purpose', newChatPurpose);
    });

    // Scenario: Delete room
    Given('I am an admin of a room', (done) => {
        when(() => chat.canIAdmin === true, done);
    });

    When('I can delete the room', () => {
        return chat.delete();
    });

    When('I invite {other users}', (callback) => {
        callback(null, 'pending');
    });

    Then('{other users} should get notified', (callback) => {
        callback(null, 'pending');
    });

    When('I kick out {person}', (callback) => {
        callback(null, 'pending');
    });

    Then('{person} should not be able to access {a room}', (callback) => {
        callback(null, 'pending');
    });


    When('I promote {person} to admin', (callback) => {
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
