const { observable, action } = require('mobx');
const Chat = require('../models/chat');
const socket = require('../network/socket');

class ChatStore {
    @observable chats = [];
    // when loadAllChats is in progress
    @observable loading = false;
    // currently selected/focused chat
    @observable activeChat = null;
    // loadAllChats() was called and finished once already
    loaded = false;

    // initial fill chats list
    @action loadAllChats() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        socket.send('/auth/kegs/user/collections')
            .then(list => {
                const promises = [];
                list.forEach(id => {
                    if (id === 'SELF') return;
                    promises.push(this._loadChat(id));
                });
                return Promise.all(promises);
            });

                const chat = new Chat(Math.random());
                chat.load();
                this.chats.push(chat);

        this.loaded = true;
            this.loading = false;

    }

    //
    @action startChat(participants) {
       // todo: look in exising
        const chat = new Chat(Math.random(), participants);
        chat.load();
        this.chats.push(chat);
        return chat;
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
