const { observable, action, computed, reaction, runInAction } = require('mobx');
const Chat = require('./chat');
const socket = require('../../network/socket');
const tracker = require('../update-tracker');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');
const MyChats = require('./my-chats');
const TinyDb = require('../../db/tiny-db');

class ChatStore {
    // todo: not sure this little event emmiter experiment should live
    EVENT_TYPES = {
        messagesReceived: 'messagesReceived'
    };

    @observable chats = observable.shallowArray([]);
    // to prevent duplicates
    chatMap = {};
    /** when chat list loading is in progress */
    @observable loading = false;
    // currently selected/focused chat
    @observable activeChat = null;
    // loadAllChats() was called and finished once already
    loaded = false;
    downloadedMyChatsUpdateId = '';

    @computed get unreadMessages() {
        return this.chats.reduce((acc, curr) => acc + curr.unreadCount, 0);
    }

    constructor() {
        this.events = new EventEmitter();
        tracker.onKegTypeUpdated('SELF', 'my_chats', this.updateMyChats);
        socket.onAuthenticated(this.updateMyChats);
        reaction(() => this.activeChat, chat => {
            if (chat) chat.loadMessages();
        });
    }

    updateMyChats = _.throttle(() => {
        if (!this.loaded) return;
        const digest = tracker.getDigest('SELF', 'my_chats');
        if (this.downloadedMyChatsUpdateId < digest.maxUpdateId) {
            const c = new MyChats();
            c.load(true)
                .then(action(() => {
                    this.chats.forEach(chat => {
                        chat.isFavorite = c.favorites.includes(chat.id);
                    });
                    c.hidden.forEach(id => {
                        if (this.chatMap[id]) this._unloadChat(this.chatMap[id]);
                    });
                }))
                .catch(err => {
                    // don't really care
                    console.error(err);
                });
        }
    }, 3000);

    onNewMessages = _.throttle(() => {
        this.events.emit(this.EVENT_TYPES.messagesReceived);
    }, 1000);

    addChat = id => {
        if (!id) throw new Error(`Invalid chat id. ${id}`);
        if (id === 'SELF' || !!this.chatMap[id]) return;
        const c = new Chat(id, undefined, this);
        this.chatMap[id] = c;
        this.chats.push(c);
        c.loadMetadata();
    };

    // initial fill chats list
    // Logic:
    // - load all favorite chats
    // - see if we have some limit left and load other unhidden chats
    // - see if digest contains some new chats that are not hidden
    @action async loadAllChats(max = 30) {
        if (this.loaded || this.loading) return;
        this.loading = true;
        // 1. Loading my_chats keg
        const mychats = new MyChats();
        await retryUntilSuccess(() => mychats.load(true));
        // 2. loading favorite chats
        runInAction(() => mychats.favorites.forEach(f => this.addChat(f)));
        // 3. checking how many more chats we can load
        const rest = max - mychats.favorites.length;
        if (rest <= 0) return;
        // 4. loading the rest unhidden chats
        await retryUntilSuccess(() =>
            socket.send('/auth/kegs/user/dbs')
                .then(action(list => {
                    let k = 0;
                    for (const id of list) {
                        if (id === 'SELF' || mychats.hidden.includes(id) || mychats.favorites.includes(id)) continue;
                        if (k++ >= rest) break;
                        this.addChat(id);
                    }
                }))
        );

        // 5. check if chats were created while we were loading chat list
        // unlikely, but possible
        Object.keys(tracker.digest).forEach(action(id => {
            if (mychats.hidden.includes(id) || mychats.favorites.includes(id)) return;
            this.addChat(id);
        }));
        // 6. set the flags and update chat feat/hidden states
        this.loading = false;
        this.loaded = true;
        this.updateMyChats();

        // 7. find out which chat to activate. TODO: store/retrieve locally
        const lastUsed = await TinyDb.user.getValue('lastUsedChat');
        if (lastUsed && this.chatMap[lastUsed]) this.activate(lastUsed);
        else if (this.chats.length) this.activate(this.chats[0].id);

        // 8. subscribe to future chats that will be created
        tracker.onKegDbAdded(id => {
            console.log(`New incoming chat: ${id}`);
            // we do this with delay, because there's possibily of receiving this event
            // as a reaction to our own process of creating a chat, and while it's not an issue
            // and is not going to break anything, we still want to avoid running useless routine
            setTimeout(() => this.addChat(id), 3000);
        });
    }

    getSelflessParticipants(participants) {
        return participants.filter(p => !p.isMe);
    }

    findCachedChatWithParticipants(participants) {
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
        // generally ui should assume currentDict user is participant to everything
        const filteredParticipants = this.getSelflessParticipants(participants);
        // maybe we already have this chat cached
        for (const c of this.chats) {
            if (c.hasSameParticipants(filteredParticipants)) return c;
        }
        return null;
    }
    //
    @action startChat(participants) {
        const cached = this.findCachedChatWithParticipants(participants);
        if (cached) {
            this.activate(cached.id);
            return cached;
        }
        const chat = new Chat(null, this.getSelflessParticipants(participants), this);
        chat.loadMetadata()
            .then(() => {
                this.addChat(chat.id);
                this.activate(chat.id);
            });
        return chat;
    }

    @action activate(id) {
        const chat = this.chatMap[id];
        if (!chat) return;
        TinyDb.user.setValue('lastUsedChat', id);
        if (this.activeChat) {
            tracker.deactivateKegDb(this.activeChat.id);
            this.activeChat.active = false;
        }
        tracker.activateKegDb(id);
        chat.active = true;
        this.activeChat = chat;
    }

    @action _unloadChat(chat) {
        if (chat.active) {
            if (this.chats.length > 1) {
                this.activate(this.chats.find(c => c.id !== chat.id).id);
            } else {
                this.activeChat = null;
            }
        }
        chat.dispose();
        chat.active = false;
        tracker.deactivateKegDb(chat.id);
        tracker.removeDbDigest(chat.id);

        delete this.chatMap[chat.id];
        this.chats.remove(chat);
    }

}

module.exports = new ChatStore();
