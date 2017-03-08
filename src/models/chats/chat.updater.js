/**
 * Module takes care of listening to chat updates and loading updated data
 */
const { observable, computed, action, reaction, when } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('../kegs/chat-keg-db');
const normalize = require('../../errors').normalize;
const User = require('../user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');
const fileStore = require('../stores/file-store');
const config = require('../../config');

const noop = () => {};
class ChatUpdater {

    constructor(chat) {
        this.chat = chat;
        tracker.onKegTypeUpdated(chat.id, 'message', this.onMessageDigestUpdate);
        this.onMessageDigestUpdate();
    }

    onMessageDigestUpdate = _.throttle(() => {
        const msgDigest = tracker.getDigest(this.chat.id, 'message');
        this.chat.unreadCount = msgDigest.newKegsCount;
        if (msgDigest.maxUpdateId === this.chat.maxUpdateId) return;
        this.chat.maxUpdateId = msgDigest.maxUpdateId;
        this.loadUpdates();
    }, 500);

    loadUpdates() {
        if (this.chat.canGoDown || !this.chat.initialPageLoaded
            || this.chat.downloadedUpdateId >= this.chat.maxUpdateId) return;

        console.log('Getting updates for chat', this.chat.id);
        socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.chat.id,
            options: {
                count: config.chat.maxLoadedMessages,
                type: 'message',
                reverse: false
            },
            filter: {
                minCollectionVersion: this.chat.downloadedUpdateId
            }
        }).then(resp => {
            this.chat.canGoDown = resp.hasMore;
            console.log(`Got ${resp.kegs.length} updates for chat`, this.chat.id);
            this.chat.addMessages(resp.kegs);
            this.markAllAsSeen();
        });
    }

    markAllAsSeen() {
        tracker.seenThis(this.chat.id, 'message', this.chat.downloadedUpdateId);
    }

}

module.exports = ChatUpdater;
