const { observable, action, computed } = require('mobx');
const Chat = require('./chat');
const socket = require('../network/socket');
const normalize = require('../errors').normalize;
const User = require('./user');

class ChatStore {
    @observable chats = [];
    /** when chat list loading is in progress */
    @observable loading = false;
    /** did chat list fail to load? */
    @observable loadError = false;
    // currently selected/focused chat
    @observable activeChat = null;
    // loadAllChats() was called and finished once already
    loaded = false;

    @computed get unreadMessages() {
        return this.chats.reduce((acc, curr) => acc + curr.unreadCount, 0);
    }

    // initial fill chats list
    @action loadAllChats() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        // server api returns all keg databases this user has access to
        socket.send('/auth/kegs/user/collections')
            .then(list => {
                for (const id of list) {
                    if (id === 'SELF') continue;
                    this.chats.push(new Chat(id));
                }
                this.loadError = false;
                this.loading = false;
                this.loaded = true;
            })
            .catch(err => {
                console.error(normalize(err, 'Fail loading chat list.'));
                this.loadError = true;
                this.loading = false;
            });
    }

    //
    @action startChat(participants) {
        // validating participants
        if (!participants || !participants.length) {
            throw new Error('Can not start chat with no participants');
        }
        for (const p of participants) {
            if (p.loading || p.notFound) {
                throw new Error(`Invalid participant: ${p.username}, loading:${p.loading}, found:${!p.notFound}`);
            }
        }
        // we don't want our own user in participants, it's handled on the lowest level only.
        // generally ui should assume current user is participant to everything
        const filteredParticipants = participants.filter(p => p.username !== User.current.username);
        // maybe we already have this chat cached
        for (const c of this.chats) {
            if (c.hasSameParticipants(filteredParticipants)) return c;
        }
        const chat = new Chat(null, filteredParticipants);
        chat.loadMetadata();
        this.chats.push(chat);
        return chat;
    }

    // todo: map
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
