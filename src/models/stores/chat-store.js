const { observable, action, computed } = require('mobx');
const Chat = require('../chat');
const socket = require('../../network/socket');
const normalize = require('../../errors').normalize;
const User = require('../user');
const tracker = require('../update-tracker');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');

class ChatStore {
    EVENT_TYPES = {
        messagesReceived: 'messagesReceived'
    };
    @observable chats = observable.shallowArray([]);
    // to prevent duplicates
    chatMap = {};
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

    constructor() {
        this.events = new EventEmitter();
    }

    onNewMessages = _.throttle(() => {
        this.events.emit(this.EVENT_TYPES.messagesReceived);
    }, 1000);

    addChat = id => {
        if (!id) throw new Error(`Invalid chat id. ${id}`);
        if (id === 'SELF' || !!this.chatMap[id]) return Promise.resolve();
        const c = new Chat(id, undefined, this);
        return c.loadMetadata().then(() => {
            if (c.errorLoadingMeta || this.chatMap[id]) return;
            this.chatMap[id] = c;
            this.chats.push(c);
        });
    };

    // initial fill chats list
    @action loadAllChats() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        // server api returns all keg databases this user has access to
        socket.send('/auth/kegs/user/collections')
            .then(action(list => {
                const promises = [];
                const lChats = [];
                for (const id of list) {
                    if (id === 'SELF') continue;
                    const c = new Chat(id, undefined, this);
                    lChats.push(c);
                    promises.push(c.loadMetadata());
                }
                // loadMetadata() promises never reject
                return Promise.all(promises).then(action(() => {
                    for (let i = 0; i < lChats.length; i++) {
                        const c = lChats[i];
                        if (c.errorLoadingMeta) continue;
                        this.chatMap[c.id] = c;
                        this.chats.push(c);
                    }
                    this.loadError = false;
                    this.loading = false;
                    this.loaded = true;
                    if (this.chats.length) this.activate(this.chats[0].id);
                }));
            }))
            .then(() => {
                // subscribe to future chats that will be created
                tracker.onKegDbAdded(id => {
                    console.log(`New incoming chat: ${id}`);
                    this.addChat(id);
                });
                // check if chats were created while we were loading chat list
                // unlikely but possible
                Object.keys(tracker.digest).forEach(this.addChat);
            })
            .catch(err => {
                console.error(normalize(err, 'Fail loading chat list.'));
                this.loadError = true;
                this.loading = false;
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
                if (this.chatMap[chat.id]) return;
                this.chatMap[chat.id] = chat;
                this.chats.push(chat);
            })
            .then(() => this.activate(chat.id));
        return chat;
    }

    @action activate(id) {
        const chat = this.chatMap[id];
        if (!chat) return;
        if (this.activeChat) {
            tracker.deactivateKegDb(this.activeChat.id);
            this.activeChat.active = false;
        }
        tracker.activateKegDb(id);
        chat.active = true;
        this.activeChat = chat;
    }
}

module.exports = new ChatStore();
