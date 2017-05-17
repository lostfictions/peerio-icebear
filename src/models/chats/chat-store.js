const L = require('l.js');
const { observable, action, computed, reaction, runInAction, autorunAsync, when } = require('mobx');
const Chat = require('./chat');
const socket = require('../../network/socket');
const tracker = require('../update-tracker');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');
const MyChats = require('./my-chats');
const TinyDb = require('../../db/tiny-db');
const ChatWatchList = require('./chat-watch-list');
const config = require('../../config');

class ChatStore {
    // todo: not sure this little event emmiter experiment should live
    EVENT_TYPES = {
        messagesReceived: 'messagesReceived'
    };
    events = new EventEmitter();

    @observable chats = observable.shallowArray([]);

    @observable unreadChatsAlwaysOnTop = false;


    // to prevent duplicates
    chatMap = {};
    // chas that were updated after login and are candidates to be added to the list
    // but only when there will be new meaningful data in them (messages)
    watchList = new ChatWatchList();
    // when chat list loading is in progress
    @observable loading = false;
    // currently selected/focused chat
    @observable activeChat = null;
    // chats set this flag and UI should use it to prevent user from spam-clicking the 'hide' button
    @observable hidingChat = false;
    // loadAllChats() was called and finished once already
    @observable loaded = false;
    downloadedMyChatsUpdateId = '';

    _hiddenChatsVersion = 0;
    _hiddenChats = []; // for reference, list of chats that uses has explicitly hidden

    @computed get unreadMessages() {
        return this.chats.reduce((acc, curr) => acc + curr.unreadCount, 0);
    }

    constructor() {
        this.watchList.onChatPromoted(id => {
            this.addChat(id, true);
        });
        tracker.onKegTypeUpdated('SELF', 'my_chats', this.updateMyChats);
        reaction(() => this.activeChat, chat => {
            if (chat) chat.loadMessages();
        });

        autorunAsync(() => {
            this.sortChats();
        }, 500);
        socket.onceAuthenticated(async () => {
            this.unreadChatsAlwaysOnTop = !!(await TinyDb.user.getValue('pref_unreadChatsAlwaysOnTop'));
            autorunAsync(() => {
                TinyDb.user.setValue('pref_unreadChatsAlwaysOnTop', this.unreadChatsAlwaysOnTop);
            }, 2000);
        });
    }

    sortChats() {
        const array = this.chats;
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            let indexHole = i;
            while (
                indexHole > 0
                && ChatStore.compareChats(array[indexHole - 1], item, this.unreadChatsAlwaysOnTop) > 0
            ) {
                array[indexHole] = array[--indexHole];
            }
            array[indexHole] = item;
        }
    }

    static compareChats(a, b, unreadOnTop) {
        if (a.isFavorite) {
            // favorite chats are sorted by name
            if (b.isFavorite) {
                return a.name.localeCompare(b.name);
            }
            // a is fav, b is not fav
            return -1;
        } else if (!b.isFavorite) {
            // non favorite chats sort by a weird combination unread count and then by update time
            if (unreadOnTop) {
                // we want chats with unread count > 0 to always come first
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
            }
            // if both chats have unread message - then sort by update time
            const amsg = a.mostRecentMessage;
            const bmsg = b.mostRecentMessage;
            if (!amsg) {
                if (!bmsg) return 0;
                return 1;
            } else if (!bmsg) {
                return -1;
            }
            return amsg.timestamp > bmsg.timestamp ? -1 : 1;
        }
        // a is not fav, b is fav
        return 1;
    }

    _updateMyChatsFn = () => {
        const digest = tracker.getDigest('SELF', 'my_chats');
        if (this.downloadedMyChatsUpdateId < digest.maxUpdateId) {
            const myChats = new MyChats();
            return myChats.load(true)
                .then(action(() => {
                    this.chats.forEach(chat => { chat.isFavorite = false; });
                    myChats.favorites.forEach(id => {
                        const favchat = this.chatMap[id];
                        if (!favchat) return;
                        favchat.isFavorite = true;
                    });
                    myChats.hidden.forEach(id => {
                        if (this.chatMap[id]) this._unloadChat(this.chatMap[id]);
                    });
                    if (myChats.version > this._hiddenChatsVersion) {
                        this._hiddenChats = myChats.hidden;
                    }
                    this.downloadedMyChatsUpdateId = myChats.collectionVersion;
                    setTimeout(this.updateMyChats, 300);
                }));
        }
        return Promise.resolve();
    };

    updateMyChats = async () => {
        return retryUntilSuccess(this._updateMyChatsFn, 'Updating MyChats keg in chat store');
    }

    onNewMessages = _.throttle(() => {
        this.events.emit(this.EVENT_TYPES.messagesReceived);
    }, 1000);

    // 'promoted' means this chat has to be added to store bypassing watchlist
    // because this chat is the part of initial list loaded on login
    // or it has been promoted by watch list
    addChat = (id, promoted) => {
        if (!id) throw new Error(`Invalid chat id. ${id}`);
        if (id === 'SELF' || !!this.chatMap[id]) return;
        if (!promoted) {
            // watchlist will immediatelly promote this chat if needed
            this.watchList.add(id);
            return;
        }
        this.watchList.remove(id); // it case this chat has been promoted not by watch list
        const c = new Chat(id, undefined, this);
        this.chatMap[id] = c;
        this.chats.push(c);
        tracker.registerDbInstance(id);
        if (this._hiddenChats.includes(id)) c.unhide();
        c.loadMetadata().then(() => c.loadMostRecentMessage());
    };

    // initial fill chats list
    // Logic:
    // - load all favorite chats
    // - see if we have some limit left and load other unhidden chats
    // - see if digest contains some new chats that are not hidden
    @action async loadAllChats() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        // 1. Loading my_chats keg
        const mychats = new MyChats();
        await retryUntilSuccess(() => mychats.load(true));
        // 2. loading favorite chats
        runInAction(() => mychats.favorites.forEach(f => this.addChat(f, true)));
        // 3. checking how many more chats we can load
        const rest = config.chat.maxInitalChats - mychats.favorites.length;
        if (rest <= 0) return;
        // 4. loading the rest unhidden chats
        await retryUntilSuccess(() =>
            socket.send('/auth/kegs/user/dbs')
                .then(action(list => {
                    let k = 0;
                    for (const id of list) {
                        if (id === 'SELF' || mychats.hidden.includes(id) || mychats.favorites.includes(id)) continue;
                        if (k++ >= rest) break;
                        this.addChat(id, true);
                    }
                }))
        );

        // 5. set the flags and update chat feat/hidden states
        await this.updateMyChats();
        // 6. waiting for most chats to load but up to a reasonable time
        await Promise.map(this.chats, chat => {
            return new Promise(resolve => when(() => chat.mostRecentMessageLoaded, resolve));
        }).timeout(3000).catch(() => { /* well, the rest will trigger re-render */ });

        this.loading = false;
        this.loaded = true;

        // 7. check if chats were created while we were loading chat list
        // unlikely, but possible
        Object.keys(tracker.digest).forEach(action(id => {
            if (mychats.hidden.includes(id) || mychats.favorites.includes(id)) return;
            this.addChat(id, true);
        }));

        // 8. find out which chat to activate.
        const lastUsed = await TinyDb.user.getValue('lastUsedChat');
        if (lastUsed) this.activate(lastUsed);
        else if (this.chats.length) this.activate(this.chats[0].id);

        // 9. subscribe to future chats that will be created
        tracker.onKegDbAdded(id => {
            // we do this with delay, because there's possibily of receiving this event
            // as a reaction to our own request to create a chat (no id yet so can't look it up in the map)
            // and while it's not an issue and is not going to break anything,
            // we still want to avoid wasting time on useless routine
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
                this.addChat(chat.id, true);
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
        tracker.unregisterDbInstance(chat.id);

        delete this.chatMap[chat.id];
        this.chats.remove(chat);
    }

}

module.exports = new ChatStore();
