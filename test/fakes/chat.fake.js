const createFakeContact = require('./contact.fake');

function createFakeChat(participantCount = 3) {
    const Chat = require('../../src/models/chats/chat');
    const participants = [];
    for (let i = 0; i < participantCount; i++) {
        participants.push(createFakeContact());
    }
    const chat = new Chat(Math.random().toString(), participants);
    return chat;
}

module.exports = createFakeChat;
