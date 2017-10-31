const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('./helpers/appConfig');
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');
const runFeature = require('./helpers/runFeature');

defineSupportCode(({ Before, Then, When }) => {
    const app = getAppInstance();
    const store = app.chatStore;

    const roomName = 'test-room';
    const roomPurpose = 'test-room';

    let room;
    let invitedUserId;

    const assignRegisteredUser = (result) => {
        invitedUserId = result.data.username;
    };

    Before({ tags: '@registeredUser', timeout: 10000 }, (testCase, cb) => {
        runFeature('Account creation')
            .then(result => {
                if (result.succeeded) {
                    assignRegisteredUser(result);
                    cb();
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    // Scenario: Create room
    When('I create a room', { timeout: 10000 }, (done) => {
        console.log(`Channels left: ${app.User.current.channelsLeft}`);

        room = store.startChat([], true, roomName, roomPurpose);
        when(() => room.added === true, done);
    });

    Then('I can rename the room', () => {
        const newChatName = 'superhero-hq';
        room.rename(newChatName);

        return asPromise(room, 'name', newChatName);
    });

    Then('I can change the room purpose', () => {
        const newChatPurpose = 'discuss superhero business';
        room.changePurpose(newChatPurpose);

        return asPromise(room, 'purpose', newChatPurpose);
    });


    // Scenario: Delete room
    Then('I can delete a room', (done) => {
        const numberOfChats = store.chats.length;
        room.delete()
            .then(() => {
                when(() => store.chats.length === numberOfChats - 1, () => {
                    const roomExists = store.chats.includes(x => x === room);
                    roomExists.should.be.false;
                    done();
                });
            });
    });


    // Scenario: Send invite
    When('I invite another user', { timeout: 10000 }, (done) => {
        const participants = [invitedUserId];
        room.addParticipants(participants)
            .then(done);
    });

    Then('they should get a room invite', { timeout: 10000 }, (cb) => {
        runFeature('Receive room invite', { username: invitedUserId, passphrase: 'secret secrets', chatId: room.id })
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Then('I receive a room invite', { timeout: 10000 }, (cb) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            const chatId = data.chatId;

            if (chatId) {
                when(() => app.chatInviteStore.received.length, () => {
                    const found = app.chatInviteStore.received.find(x => x.kegDbId === chatId);
                    found.should.be.ok;
                    cb();
                });
            } else {
                cb('No chat id passed in', 'failed');
            }
        } else {
            cb('No data passed in', 'failed');
        }
    });


    // Scenario: Kick member
    When('someone has joined the room', { timeout: 20000 }, (cb) => {
        const participants = [invitedUserId];
        const other = { username: invitedUserId, passphrase: 'secret secrets', chatId: room.id };
        room.addParticipants(participants)
            .then(() => {
                runFeature('Accept room invite', other)
                    .then(result => {
                        if (result.succeeded) {
                            cb();
                        } else {
                            cb(result.errors, 'failed');
                        }
                    });
            });
    });

    Then('I accept a room invite', { timeout: 10000 }, (cb) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            const chatId = data.chatId;

            if (chatId) {
                when(() => app.chatInviteStore.received.length, () => {
                    const found = app.chatInviteStore.received.find(x => x.kegDbId === chatId);
                    found.should.be.ok;

                    app.chatInviteStore.acceptInvite(chatId).then(cb);
                });
            } else {
                cb('No chat id passed in', 'failed');
            }
        } else {
            cb('No data passed in', 'failed');
        }
    });

    Then('I them kick out', { timeout: 10000 }, (done) => {
        const participants = room.joinedParticipants.length;
        room.removeParticipant(invitedUserId);

        when(() => room.joinedParticipants.length === participants - 1, done);
    });

    Then('they should not be in the room anymore', () => {
        const exists = room.joinedParticipants.includes(x => x.username === invitedUserId);
        exists.should.false;
    });


    // Scenario: Promote member
    When('I can promote them to admin', { timeout: 10000 }, () => {
        const admin = room.joinedParticipants.find(x => x.username === invitedUserId);
        return room.promoteToAdmin(admin);
    });


    // Scenario: Demote member
    Then('I can demote them as admin', { timeout: 10000 }, () => {
        const admin = room.joinedParticipants.find(x => x.username === invitedUserId);
        return room.demoteAdmin(admin);
    });


    // Scenario: Can not create more than 3 rooms
    When('I created 3 rooms', () => {
        const invited = new app.Contact(invitedUserId, {}, true);
        console.log(app.User.current.channelsLeft); // 0

        room = app.chatStore.startChat([invited], true, roomName, roomPurpose);
        console.log(room); // TypeError: Cannot read property 'added' of null
    });
});
