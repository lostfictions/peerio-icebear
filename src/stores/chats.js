const { observable, action } = require('mobx');
const socket = require('../network/socket');
const Chat = require('../models/kegs/chat-keg-db');

class Chats {
    @observable chats = [];

    @action loadChats() {
        return socket.send('/auth/kegs/user/collections')
            .then(list => {
                const promises = [];
                list.forEach(id => {
                    if (id === 'SELF') return;
                    promises.push(this._loadChat(id));
                });
                return Promise.all(promises);
            });
    }

    /**
     * just a helper function
     * @param {string} id
     * @returns {Promise}
     */
    _loadChat(id) {
        const chat = new Chat(id);
        return chat.load().then(() => {
            this.chats.push(chat);
        });
    }

    /**
     * adds a new chat, or reuses existing for this participants
     * @param {Array<string>} participants
     */
    addChat(participants) {
        // looking for existing(loaded) chat
        nextChat: for (let i = 0; i < this.chats.length; i++) {
            const chat = this.chats[i];
            if (chat.participants.length !== participants.length) continue;
            for (let j = 0; j < participants.length; j++) {
                if (!chat.participants.includes(participants[j])) continue nextChat;
            }
            // chat with same participants found
            return Promise.resolve(chat);
        }
        // involving server to create/load one
        const chat = new Chat(null, participants);
        return chat.load().then(() => {
            this.chats.push(chat);
        });
    }

}

module.exports = new Chats();
