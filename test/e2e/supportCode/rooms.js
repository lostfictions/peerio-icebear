const defineSupportCode = require('cucumber').defineSupportCode;
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');
const { runFeature, checkResult, checkResultAnd } = require('./helpers/runFeature');
const { getPropFromEnv } = require('./helpers/envHelper');
const { getChatStore, getChatInviteStore, currentUser } = require('./client');

defineSupportCode(({ Before, Then, When, After }) => {
    const chatStore = getChatStore();
    const inviteStore = getChatInviteStore();

    const roomName = 'test-room';
    const roomPurpose = 'test-room';

    let room;
    let invitedUserId;

    const assignRegisteredUser = (data) => {
        invitedUserId = data.username;
    };

    Before('@registeredUser', () => {
        return runFeature('Account creation')
            .then(checkResultAnd)
            .then(assignRegisteredUser);
    });

    After(() => {
        return Promise.each(chatStore.chats, chat => {
            if (chat.canIAdmin) {
                return chat.delete();
            }
            return Promise.resolve();
        }).then(() => {
            console.log(`---Channels left: ${currentUser().channelsLeft}`);
        });
    });

    // Scenario: Create room
    When('I create a room', (done) => {
        console.log(`Channels left: ${currentUser().channelsLeft}`);

        room = chatStore.startChat([], true, roomName, roomPurpose);
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
    Then('I can delete a room', () => {
        const numberOfChats = chatStore.chats.length;
        return room.delete()
            .then(() => {
                when(() => chatStore.chats.length === numberOfChats - 1, () => {
                    const roomExists = chatStore.chats.includes(x => x === room);
                    roomExists.should.be.false;
                });
            });
    });


    // Scenario: Send invite
    When('I invite another user', () => {
        return room.addParticipants([invitedUserId]);
    });

    Then('they should get a room invite', () => {
        const other = { username: invitedUserId, passphrase: 'secret secrets', chatId: room.id };
        return runFeature('Receive room invite', other)
            .then(checkResult);
    });

    Then('I receive a room invite', (cb) => {
        const chatId = getPropFromEnv('chatId');

        when(() => inviteStore.received.length, () => {
            const found = inviteStore.received.find(x => x.kegDbId === chatId);
            found.should.be.ok;
            cb();
        });
    });


    // Scenario: Kick member
    When('someone has joined the room', { timeout: 20000 }, () => {
        const other = { username: invitedUserId, passphrase: 'secret secrets', chatId: room.id };
        return room.addParticipants([invitedUserId])
            .then(() => {
                return runFeature('Accept room invite', other)
                    .then(checkResult);
            });
    });

    Then('I accept a room invite', (cb) => {
        const chatId = getPropFromEnv('chatId');

        when(() => inviteStore.received.length, () => {
            const found = inviteStore.received.find(x => x.kegDbId === chatId);
            found.should.be.ok;

            inviteStore.acceptInvite(chatId).then(cb);
        });
    });

    Then('I them kick out', (done) => {
        const participants = room.joinedParticipants.length;
        room.removeParticipant(invitedUserId);

        when(() => room.joinedParticipants.length === participants - 1, done);
    });

    Then('they should not be in the room anymore', () => {
        const exists = room.joinedParticipants.includes(x => x.username === invitedUserId);
        exists.should.false;
    });


    // Scenario: Promote member
    When('I can promote them to admin', () => {
        const admin = room.joinedParticipants.find(x => x.username === invitedUserId);
        return room.promoteToAdmin(admin);
    });


    // Scenario: Demote member
    Then('I can demote them as admin', () => {
        const admin = room.joinedParticipants.find(x => x.username === invitedUserId);
        return room.demoteAdmin(admin);
    });


    // Scenario: Can not create more than 3 rooms
    When('I created 3 rooms', () => {
        // const invited = new app.Contact(invitedUserId, {}, true);
        // console.log(currentUser().channelsLeft); // 0

        // room = chatStore.startChat([invited], true, roomName, roomPurpose);
        // console.log(room); // TypeError: Cannot read property 'added' of null
    });
});
