const { observable, action, computed } = require('mobx');
const Chat = require('./chat');
const socket = require('../../network/socket');
const normalize = require('../../errors').normalize;
const tracker = require('../update-tracker');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');

class ChatStore {
    EVENT_TYPES = {
        messagesReceived: 'messagesReceived'
    };
    @observable chats = observable.shallowArray([]);
    // to prevent duplicates
    chatMap = {};
    // to detect new chats created while we were offline
    _knownChats = {};
    /** when chat list loading is in progress */
    @observable loading = false;
    // currently selected/focused chat
    @observable activeChat = null;
    // loadAllChats() was called and finished once already
    loaded = false;


    @computed get unreadMessages() {
        return this.chats.reduce((acc, curr) => acc + curr.unreadCount, 0);
    }

    constructor() {
        this.events = new EventEmitter();
        socket.onAuthenticated(this.checkForNewChats);
    }

    onNewMessages = _.throttle(() => {
        this.events.emit(this.EVENT_TYPES.messagesReceived);
    }, 1000);

    addChat = id => {
        if (!id) throw new Error(`Invalid chat id. ${id}`);
        if (id === 'SELF' || !!this.chatMap[id]) return;
        const c = new Chat(id, undefined, this);
        this.chatMap[id] = c;
        this._knownChats[id] = true;
        this.chats.push(c);
        c.loadMetadata();
    };

    // after reconnect we want to check if there was something added
    @action.bound checkForNewChats() {
        retryUntilSuccess(() =>
            socket.send('/auth/kegs/user/dbs')
                .then(action(list => {
                    for (const id of list) {
                        if (id === 'SELF') continue;
                        if (!this._knownChats[id]) this.addChat(id);
                    }
                })), 'CheckForNewChats');
    }

    // initial fill chats list
    @action loadAllChats(max) {
        if (this.loaded || this.loading) return;
        this.loading = true;
        retryUntilSuccess(() =>
            socket.send('/auth/kegs/user/dbs')
                .then(action(list => {
                    let k = 0;
                    for (const id of list) {
                        if (id === 'SELF') continue;
                        if (max && k++ >= max) break;
                        this.addChat(id);
                    }
                    this.loading = false;
                    this.loaded = true;
                    if (this.chats.length) this.activate(this.chats[0].id);
                }))
                .then(() => {
                    // subscribe to future chats that will be created
                    tracker.onKegDbAdded(id => {
                        console.log(`New incoming chat: ${id}`);
                        // we do this with delay, because there's possibily of receiving this event
                        // as a reaction to our own process of creating a chat, and while it's not an issue
                        // and is not going to break anything, we still want to avoid running useless routine
                        setTimeout(() => this.addChat(id), 3000);
                    });
                    // check if chats were created while we were loading chat list
                    // unlikely, but possible
                    Object.keys(tracker.digest).forEach(this.addChat);
                })
                .tapCatch(err => {
                    console.error(normalize(err, 'Error loading chat list.'));
                }), 'LoadAllChats');
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
