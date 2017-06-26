const { observable, computed, action, when, reaction } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('../kegs/chat-keg-db');
const User = require('../user/user');
const ChatFileHandler = require('./chat.file-handler');
const ChatMessageHandler = require('./chat.message-handler');
const ChatReceiptHandler = require('./chat.receipt-handler');
const config = require('../../config');
const Queue = require('../../helpers/queue');
const clientApp = require('../client-app');
const DOMPurify = require('dompurify');
const ChatHead = require('./chat-head');

// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

// !! IN CASE YOUR EDITOR SHOWS THE STRING BELOW AS WHITESPACE !!
// Know that it's not a whitespace, it's unicode :thumb_up: emoji
const ACK_MSG = '👍';

/**
 * at least one of two arguments should be set
 * @param {string} id - chat id
 * @param {Array<Contact>} participants - chat participants
 * @param {ChatStore} store
 * @public
 */
class Chat {
    constructor(id, participants, store) {
        this.id = id;
        this.store = store;
        if (!id) this.tempId = getTemporaryChatId();
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
        this._reactionsToDispose.push(reaction(() => this.active && clientApp.isFocused && clientApp.isInChatsView,
            shouldSendReceipt => {
                if (shouldSendReceipt) this._sendReceipt();
            }));
    }

    /**
     * Chat id
     * @member {?string} id
     * @memberof Chat
     * @instance
     * @public
     */
    @observable id = null;

    /**
     * Render these messages.
     * @member {ObservableArray<Message>} messages
     * @memberof Chat
     * @instance
     * @public
     */
    @observable messages = observable.shallowArray([]);
    /**
     * Render these messages at the bottom of the chat, they don't have Id yet, you can use tempId.
     * @member {ObservableArray<Message>} limboMessages
     * @memberof Chat
     * @instance
     * @public
     */
    @observable limboMessages = observable.shallowArray([]);

    // performance helper, to lookup messages by id and avoid duplicates
    _messageMap = {};

    /**
     * Does not include current user.
     * @member {ObservableArray<Contact>} participant
     * @memberof Chat
     * @instance
     * @public
     */
    @observable participants = [];


    /**
     * If true - chat is not ready for anything yet.
     * @member {boolean} loadingMeta
     * @memberof Chat
     * @instance
     * @public
     */
    @observable loadingMeta = false;
    /**
     * @member {boolean} metaLoaded
     * @memberof Chat
     * @instance
     * @public
     */
    @observable metaLoaded = false;


    /**
     * This can happen when chat was just added or after reset()
     * @member {boolean} loadingInitialPage
     * @memberof Chat
     * @instance
     * @public
     */
    @observable loadingInitialPage = false;
    /**
     * Ready to render messages.
     * @member {boolean} initialPageLoaded
     * @memberof Chat
     * @instance
     * @public
     */
    @observable initialPageLoaded = false;
    /**
     * Ready to render most recent message contents in chat list.
     * @member {boolean} mostRecentMessageLoaded
     * @memberof Chat
     * @instance
     * @public
     */
    @observable mostRecentMessageLoaded = false;
    /**
     * @member {boolean} loadingTopPage
     * @memberof Chat
     * @instance
     * @public
     */
    @observable loadingTopPage = false;
    /**
     * @member {boolean} loadingBottomPage
     * @memberof Chat
     * @instance
     * @public
     */
    @observable loadingBottomPage = false;


    /**
     * can we go back in history from where we are? (load older messages)
     * @member {boolean} canGoUp
     * @memberof Chat
     * @instance
     * @public
     */
    @observable canGoUp = false;
    /**
     * can we go forward in history or we have the most recent data loaded
     * @member {boolean} canGoDown
     * @memberof Chat
     * @instance
     * @public
     */
    @observable canGoDown = false;
    /**
     * currently selected/focused in UI
     * @member {boolean} active
     * @memberof Chat
     * @instance
     * @public
     */
    @observable active = false;

    /**
     * @member {boolean} isFavorite
     * @memberof Chat
     * @instance
     * @public
     */
    @observable isFavorite = false;

    /**
     * Prevent spamming 'Favorite' button in GUI.
     * @member {boolean} changingFavState
     * @memberof Chat
     * @instance
     * @public
     */
    @observable changingFavState = false;

    /**
     * list of files being uploaded to this chat.
     * @member {ObservableArray<File>} uploadQueue
     * @memberof Chat
     * @instance
     * @public
     */
    @observable uploadQueue = observable.shallowArray([]);
    /**
     * Unread message count in this chat.
     * @member {number} unreadCount
     * @memberof Chat
     * @instance
     * @public
     */
    @observable unreadCount = 0;
    /**
     * when user is not looking but chat is active and receiving updates,
     * chat briefly sets this value to the id of last seen message so client can render separator marker.
     * @member {string} newMessagesMarkerPos
     * @memberof Chat
     * @instance
     * @public
     */
    @observable newMessagesMarkerPos = '';

    /**
     * Chat head keg.
     * Observable, because `this.name` relies on it
     * @member {?ChatHead} chatHead
     * @memberof Chat
     * @instance
     * @public
     */
    @observable.ref chatHead;
    _messageHandler = null;
    _receiptHandler = null;
    _fileHandler = null;
    _headHandler = null;

    _addMessageQueue = new Queue(1, config.chat.decryptQueueThrottle || 0);

    _reactionsToDispose = [];
    /**
     * @member {boolean} isReadOnly
     * @memberof Chat
     * @instance
     * @public
     */
    @computed get isReadOnly() {
        return this.participants.length > 0
            && this.participants.filter(p => p.isDeleted).length === this.participants.length;
    }

    /**
     * Excluding current user.
     * @member {Array<string>} participantUsernames
     * @memberof Chat
     * @instance
     * @public
     */
    @computed get participantUsernames() {
        // if (!this.participants) return null;
        return this.participants.map(p => p.username);
    }

    /**
     * @member {string} name
     * @memberof Chat
     * @instance
     * @public
     */
    @computed get name() {
        if (this.chatHead && this.chatHead.chatName) return this.chatHead.chatName;
        if (!this.participants) return '';
        return this.participants.length === 0
            ? (User.current.fullName || User.current.username)
            : this.participants.map(p => p.fullName || p.username).join(', ');
    }

    /**
     * User should not be able to send multiple ack messages in a row. We don't limit it on SDK level, but GUIs should.
     * @member {boolean} canSendAck
     * @memberof Chat
     * @instance
     * @public
     */
    @computed get canSendAck() {
        if (this.limboMessages.length) {
            for (let i = 0; i < this.limboMessages.length; i++) {
                if (this.limboMessages[i].text === ACK_MSG) return false;
            }
        }
        if (!this.initialPageLoaded) return false;
        if (this.canGoDown) return true;
        if (!this.messages.length) return true;
        const lastmsg = this.messages[this.messages.length - 1];
        if (lastmsg.sender.username !== User.current.username) return true;
        if (lastmsg.text === ACK_MSG) return false;
        return true;
    }

    /**
     * Don't render message marker if this is false.
     * @member {boolean} showNewMessagesMarker
     * @memberof Chat
     * @instance
     * @public
     */
    @computed get showNewMessagesMarker() {
        if (!this.newMessagesMarkerPos) return false;
        for (let i = this.messages.length - 1; i >= 0 && this.messages[i].id !== this.newMessagesMarkerPos; i--) {
            if (this.messages[i].sender.username !== User.current.username) return true;
        }
        return false;
    }

    /**
     * @member {?Message} mostRecentMessage
     * @memberof Chat
     * @instance
     * @public
     */
    @observable mostRecentMessage;

    _metaPromise = null;
    /**
     * @returns {Promise}
     * @private
     */
    loadMetadata() {
        if (this.metaLoaded || this.loadingMeta) return this._metaPromise;
        this.loadingMeta = true;
        // retry is handled inside loadMeta()
        this._metaPromise = this.db.loadMeta()
            .then(action(justCreated => { // eslint-disable-line
                if (this.db.dbIsBroken) {
                    const errmsg = `Detected broken database. id ${this.db.id}`;
                    console.error(errmsg);
                    throw new Error(errmsg);
                }
                this.id = this.db.id;
                this.participants = this.db.participants;// todo computed
                this._messageHandler = new ChatMessageHandler(this);
                this._fileHandler = new ChatFileHandler(this);
                this._receiptHandler = new ChatReceiptHandler(this);
                this.chatHead = new ChatHead(this.db);
                this.loadingMeta = false;
                this.metaLoaded = true;
                if (justCreated) {
                    const m = new Message(this.db);
                    m.setChatCreationFact();
                    return this._sendMessage(m);
                }
                setTimeout(() => this._messageHandler.onMessageDigestUpdate(), 2000);
            }));
        return this._metaPromise;
    }

    /**
     * Adds messages to current message list.
     * @param {Array<Object|Message>} kegs - list of messages to add
     * @param {boolean} [prepend=false] - add message to top of bottom
     * @function addMessages
     * @memberof Chat
     * @instance
     * @protected
     */
    @action addMessages(kegs, prepend = false) {
        if (!kegs || !kegs.length) return Promise.resolve();
        return new Promise((resolve) => {
            // we need this because we don't want to add messages one by one causing too many renders
            const accumulator = [];
            for (let i = 0; i < kegs.length; i++) {
                this._addMessageQueue.addTask(this._parseMessageKeg, this, [kegs[i], accumulator]);
            }
            this._addMessageQueue.addTask(this._finishAddMessages, this, [accumulator, prepend], resolve);
        });
    }

    // decrypting a bunch of kegs in one call is tough on mobile, so we do it asynchronously one by one
    _parseMessageKeg(keg, accumulator) {
        const msg = new Message(this.db);
        // no payload for some reason. probably because of connection break after keg creation
        if (!msg.loadFromKeg(keg) || msg.isEmpty) {
            console.debug('empty message keg', keg);
            return;
        }
        accumulator.push(msg);
    }

    /**
     * Alert UI hooks of new messages/mentions.
     * @param {Number} freshBatchMentionCount -- # of new/freshly loaded messages
     * @param {Number} freshBatchMessageCount -- # of new/freshly loaded mentions
     * @param {Number} lastMentionId -- id of last mention message, if exists
     * @private
     */
    onNewMessageLoad(freshBatchMentionCount, freshBatchMessageCount, lastMentionId) {
        // fresh batch could mean app/page load rather than unreads,
        // but we don't care about unread count if there aren't *new* unreads
        if (this.unreadCount && freshBatchMessageCount) {
            const lastMessageText = lastMentionId ?
                this._messageMap[lastMentionId].text : this.messages[this.messages.length - 1].text;
            this.store.onNewMessages({
                freshBatchMentionCount,
                lastMessageText,
                unreadCount: this.unreadCount,
                chat: this
            });
        }
    }

    // all kegs are decrypted and parsend, now we just push them to the observable array
    @action _finishAddMessages(accumulator, prepend) {
        let newMessageCount = 0;
        let newMentionCount = 0;
        let lastMentionId;

        for (let i = 0; i < accumulator.length; i++) {
            const msg = accumulator[i];
            // deleted message case
            if (msg.deleted) {
                delete this._messageMap[i];
                this.messages.remove(msg);
                continue;
            }
            // todo: maybe compare collection vesions? Although sending message's collection version is not confirmed
            // changed message case
            const existing = this._messageMap[msg.id];
            if (existing) {
                this.messages.remove(existing);
                msg.setUIPropsFrom(existing);
            } else {
                // track number of new messages & mentions in 'batch'
                newMessageCount += 1;
                if (msg.isMention) {
                    newMentionCount += 1;
                    lastMentionId = msg.id;
                }
            }
            // new message case
            this._messageMap[msg.id] = msg;
            this.messages.push(msg);
        }
        this.onNewMessageLoad(newMentionCount, newMessageCount, lastMentionId);

        // sort
        this.sortMessages();
        // updating most recent message
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            if (!this.mostRecentMessage || +this.mostRecentMessage.id < +msg.id) {
                this.mostRecentMessage = msg;
            }
            break;
        }

        const excess = this.messages.length - config.chat.maxLoadedMessages;
        if (excess > 0) {
            if (prepend) {
                for (let i = this.messages.length - excess; i < this.messages.length; i++) {
                    delete this._messageMap[this.messages[i].id];
                }
                this.messages.splice(-excess);
                this.canGoDown = true;
            } else {
                for (let i = 0; i < excess; i++) {
                    delete this._messageMap[this.messages[i].id];
                }
                this.messages.splice(0, excess);
                this.canGoUp = true;
            }
        }

        this._detectFirstOfTheDayFlag();
        this._detectGrouping();
        this._detectLimboGrouping();
        if (!prepend) this._sendReceipt();// no sense in sending receipts when paging back
        this._receiptHandler.applyReceipts();
    }

    /**
     * Sorts messages in-place as opposed to ObservableArray#sort that returns a copy of array.
     * We use insertion sorting because it's optimal for our mostly always sorted small array.
     * @protected
     */
    sortMessages() {
        const array = this.messages;
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            let indexHole = i;
            while (indexHole > 0 && Chat.compareMessages(array[indexHole - 1], item) > 0) {
                array[indexHole] = array[--indexHole];
            }
            array[indexHole] = item;
        }
    }

    static compareMessages(a, b) {
        if (+a.id > +b.id) {
            return 1;
        }
        // in our case we only care if return value is 1 or not. So we skip value 0
        return -1;
    }

    _sendMessage(m) {
        if (this.canGoDown) this.reset();
        // send() will fill message with data required for rendering
        const promise = m.send();
        this.limboMessages.push(m);
        this._detectLimboGrouping();
        when(() => !!m.id, action(() => {
            this.limboMessages.remove(m);
            m.tempId = null;
            // unless user already scrolled to high up, we add the message
            if (!this.canGoDown) {
                this._finishAddMessages([m], false);
            } else {
                this._detectLimboGrouping();
            }
        }));
        return promise;
    }

    /**
     * @function sendMessage
     * @param {string} text
     * @param {Array<File>} [files]
     * @returns {Promise}
     * @memberof Chat
     */
    @action sendMessage(text, files) {
        const m = new Message(this.db);
        m.files = files;
        m.text = text;
        return this._sendMessage(m);
    }

    /**
     * todo: this is temporary, for messages that failed to send.
     * When we have message delete - it should be unified process.
     * @function removeMessage
     * @param {Message} message
     * @memberof Chat
     * @instance
     * @public
     */
    @action removeMessage(message) {
        this.limboMessages.remove(message);
        this.messages.remove(message);
        delete this._messageMap[message.id];
    }
    /**
     * @returns {Promise}
     * @public
     */
    sendAck() {
        return this.sendMessage(ACK_MSG);
    }

    /**
     * Checks if this chat's participants are the same with ones that are passed
     * @param participants
     * @returns boolean
     * @protected
     */
    hasSameParticipants(participants) {
        if (this.participants.length !== participants.length) return false;

        for (const p of participants) {
            if (!this.participants.includes(p)) return false;
        }
        return true;
    }

    /**
     * Note that file will not be shared if session ends, but it will be uploaded because of upload resume logic.
     * @param {string} path
     * @param {string} [name]
     * @param {boolean} [deleteAfterUpload=false]
     * @returns {Promise}
     * @public
     */
    uploadAndShareFile(path, name, deleteAfterUpload = false) {
        return this._fileHandler.uploadAndShare(path, name, deleteAfterUpload);
    }

    /**
     * @param {Array<File>} files
     * @returns {Promise}
     * @public
     */
    shareFiles(files) {
        return this._fileHandler.share(files);
    }

    /**
     * @returns {Promise}
     * @protected
     */
    loadMostRecentMessage() {
        return this._messageHandler.loadMostRecentMessage();
    }

    /**
     * @returns {Promise}
     * @protected
     */
    async loadMessages() {
        if (!this.metaLoaded) await this.loadMetadata();
        this._messageHandler.getInitialPage()
            .then(() => this._messageHandler.onMessageDigestUpdate());
    }

    /**
     * @public
     */
    loadPreviousPage() {
        if (!this.canGoUp) return;
        this._messageHandler.getPage(true);
    }

    /**
     * @public
     */
    loadNextPage() {
        if (!this.canGoDown) return;
        this._messageHandler.getPage(false);
    }

    /**
     * @param {string} name - pass empty string to remove chat name
     * @public
     */
    rename(name) {
        let validated = name || '';
        validated = DOMPurify.sanitize(validated, { ALLOWED_TAGS: [] }).trim();
        validated = validated.substr(0, 120);
        if (this.chatHead.chatName === validated || (!this.chatHead.chatName && !validated)) {
            return Promise.resolve(); // nothing to rename
        }
        return this.chatHead.save(() => {
            this.chatHead.chatName = validated;
        }, null, 'error_chatRename')
            .then(() => {
                const m = new Message(this.db);
                m.setRenameFact(validated);
                return this._sendMessage(m);
            });
    }

    /**
     * @function toggleFavoriteState
     * @public
     */
    toggleFavoriteState = () => {
        this.changingFavState = true;
        const myChats = this.store.myChats;
        const newVal = !this.isFavorite;
        myChats.save(
            () => {
                newVal ? myChats.addFavorite(this.id) : myChats.removeFavorite(this.id);
            },
            () => {
                newVal ? myChats.removeFavorite(this.id) : myChats.addFavorite(this.id);
            }
        ).then(() => { this.isFavorite = newVal; })
            .finally(() => { this.changingFavState = false; });
    }

    /**
     * @function hide
     * @public
     */
    hide = () => {
        this.store.unloadChat(this);
        this.store.hidingChat = true;
        return this.store.myChats.save(() => {
            this.store.myChats.addHidden(this.id);
        }).finally(() => { this.store.hidingChat = false; });
    };

    /**
     * @function unhide
     * @public
     */
    unhide = () => {
        return this.store.myChats.save(() => {
            this.store.myChats.removeHidden(this.id);
        });
    };

    /**
     * Reloads most recent page of the chat like it was just added.
     * @public
     */
    reset() {
        this.loadingInitialPage = false;
        this.initialPageLoaded = false;
        this.loadingTopPage = false;
        this.loadingBottomPage = false;
        this.canGoUp = false;
        this.canGoDown = false;
        this._messageMap = {};
        this.messages.clear();
        this._cancelTopPageLoad = false;
        this._cancelBottomPageLoad = false;
        this.loadMessages();
    }

    /**
     * Detects and sets firstOfTheDay flag for all loaded messages
     * @private
     */
    _detectFirstOfTheDayFlag() {
        if (!this.messages.length) return;
        this.messages[0].firstOfTheDay = true;

        for (let i = 1; i < this.messages.length; i++) {
            const current = this.messages[i];
            if (this.messages[i - 1].dayFingerprint !== current.dayFingerprint) {
                current.firstOfTheDay = true;
            } else {
                current.firstOfTheDay = false;
            }
        }
    }

    _detectGrouping() {
        if (!this.messages.length) return;
        this.messages[0].groupWithPrevious = false;

        for (let i = 1; i < this.messages.length; i++) {
            const current = this.messages[i];
            const prev = this.messages[i - 1];
            if (prev.sender.username === current.sender.username
                && prev.dayFingerprint === current.dayFingerprint
                && (current.timestamp - prev.timestamp) < 600000) { // 10 minutes
                current.groupWithPrevious = true;
            } else {
                current.groupWithPrevious = false;
            }
        }
    }

    _detectLimboGrouping() {
        if (!this.limboMessages.length) return;
        const prev = this.messages.length ? this.messages[this.messages.length - 1] : null;
        const current = this.limboMessages[0];
        current.groupWithPrevious = !!(prev && prev.sender.username === current.sender.username);
        for (let i = 1; i < this.limboMessages.length; i++) {
            this.limboMessages[i].groupWithPrevious = true;
        }
    }

    _sendReceipt() {
        // messages are sorted at this point ;)
        if (!this.messages.length) return;
        if (!clientApp.isFocused || !clientApp.isInChatsView || !this.active) return;

        this._receiptHandler.sendReceipt(+this.messages[this.messages.length - 1].id);
    }

    dispose() {
        try {
            this._reactionsToDispose.forEach(d => d());
            if (this._messageHandler) this._messageHandler.dispose();
            if (this._receiptHandler) this._receiptHandler.dispose();
            if (this._headHandler) this._headHandler.dispose();
        } catch (err) {
            console.error(err);
        }
    }

}

module.exports = Chat;
