const { observable, action } = require('mobx');
const Chat = require('../models/chat');

class ChatStore {
    @observable chats =[];
    @observable loading = false;
    @observable activeChat = null;
    loaded = false;

    @action loadAllChats() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        setTimeout(() => {
            while (Math.random() < 0.8) {
                const chat = new Chat(Math.random());
                chat.load();
                this.chats.push(chat);
            }
            this.loaded = true;
            this.loading = false;
        }, 2000);
    }

    @action startChat(participants) {
        const chat = new Chat(Math.random(), participants);
        chat.load();
        this.chats.push(chat);
    }

    findById(id) {
        for (const chat of this.chats) {
            if (chat.id === id) return chat;
        }
        return null;
    }

    @action activate(id) {
        const chat = this.findById(id);
        if (!chat) return;
        if (this.activeChat) this.activeChat.active = false;
        chat.active = true;
        this.activeChat = chat;
    }
}

module.exports = new ChatStore();
