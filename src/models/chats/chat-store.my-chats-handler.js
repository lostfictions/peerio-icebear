const socket = require('../../network/socket');
const tracker = require('../update-tracker');
const MyChats = require('./my-chats');
const { observable, action, computed, reaction, runInAction, autorunAsync, when } = require('mobx');
const { retryUntilSuccess } = require('../../helpers/retry');
const Queue = require('../../helpers/queue');

// 2 important things happen here
// 1. Keeping local copy of MyChats keg data up to date.
// 2. Safely and sequentially storing local changes to it.
class MyChatsHandler {
    myChats = new MyChats();
    saveQueue = new Queue(1, 0);

    constructor(store) {
        this.store = store;
        // this will make sure we'll update every time server sends a new digest
        // it will also happen after reconnect, becasue SELF digest is always refreshed on reconnect
        tracker.onKegTypeUpdated('SELF', 'my_chats', this.updateMyChats);
        // this will load initial data
        socket.onceAuthenticated(() => this.myChats.load());
    }

    updateMyChats = () => retryUntilSuccess(() => {
        // do we even need to update?
        const digest = tracker.getDigest('SELF', 'my_chats');
        if (this.mychats.collectionVersion >= digest.maxUpdateId) return Promise.resolve();

        return this.myChats.load(true)
            .then(() => {
                // this will make sure that we get any updates we possibly got notified about
                // while finishing current operation
                setTimeout(this.updateMyChats, 300);
            });
    }, 'Updating MyChats keg in chat store');

    // takes current fav/hidden lists and makes sure store.chats reflect it
    @action applyMyChatsData() {
        // resetting fav state for every chat
        this.store.chats.forEach(chat => { chat.isFavorite = false; });
        // marking favs as such
        this.myChats.favorites.forEach(id => {
            const favchat = this.store.chatMap[id];
            if (!favchat) {
                // fav chat isn't loaded, probably got favorited on another device
                this.store.addChat(id, true);
            }
            favchat.isFavorite = true;
        });
        // hiding all hidden chats
        this.myChats.hidden.forEach(id => {
            const chat = this.chatMap[id];
            if (chat) chat.hide();
        });
    }

    favoriteChat(id) {

    }

    unfavoriteChat(id) {

    }

    hideChat(id) {

    }

}


module.exports = MyChatsHandler;
