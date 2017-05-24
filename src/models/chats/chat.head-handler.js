
const tracker = require('../update-tracker');
const ChatHead = require('./chat-head');
const { retryUntilSuccess } = require('../../helpers/retry');
const warnings = require('../warnings');
const Message = require('../chats/message');

class ChatHeadHandler {
    downloadedCollectionVersion = '';

    constructor(chat) {
        this.chat = chat;
        tracker.onKegTypeUpdated(chat.id, 'chat_head', this.updateChatHead);
        this.updateChatHead();
    }

    updateChatHead = () => {
        retryUntilSuccess(() =>
            this._loadKeg().then(keg => {
                if (this.downloadedCollectionVersion > keg.collectionVersion) return;
                this.chat._chatName = keg.chatName;
                this.downloadedCollectionVersion = keg.collectionVersion;
                tracker.seenThis(this.chat.db.id, 'chat_head', keg.collectionVersion);
            })
        );
    }

    _loadKeg() {
        return new ChatHead(this.chat.db).load(true);
    }

    saveChatName(name) {
        return this._loadKeg()
            .then(keg => {
                keg.chatName = name;
                return keg.saveToServer();
            })
            .tapCatch(err => {
                console.error(err);
                warnings.add('error_chatRename');
            })
            .then(() => {
                const m = new Message(this.chat.db);
                m.setRenameFact(name);
                return this.chat._sendMessage(m);
            });
    }

    dispose() {
        tracker.unsubscribe(this.updateChatHead);
    }

}

module.exports = ChatHeadHandler;
