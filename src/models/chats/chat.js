const { observable, computed, action, when } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('../kegs/chat-keg-db');
const normalize = require('../../errors').normalize;
const User = require('../user');
const ChatFileHandler = require('./chat.file-handler');
const ChatMessageHandler = require('./chat.message-handler');
const ChatReceiptHandler = require('./chat.receipt-handler');
const config = require('../../config');

// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

class Chat {

    @observable id = null;

    // Message objects
    @observable messages = observable.shallowArray([]);
    // Messages that do not have Id yet
    @observable limboMessages = observable.shallowArray([]);
    // performance helper, to lookup messages by id and avoid duplicates
    _messageMap = {};

    /** @type {Array<Contact>} */
    @observable participants = null;

    // initial metadata loading
    @observable loadingMeta = false;
    metaLoaded = false;

    // initial messages loading
    @observable loadingInitialPage = false;
    @observable initialPageLoaded = false;
    @observable loadingTopPage = false;
    @observable loadingBottomPage = false;

    @observable canGoUp = false; // can we go back in history from where we are? (load older messages)
    @observable canGoDown = false; // can we go forward in history or we have the most recent data loaded
    // currently selected/focused in UI
    @observable active = false;

    // list of files being uploaded to this chat
    @observable uploadQueue = observable.shallowArray([]);
    @observable unreadCount = 0;

    _messageHandler = null;
    _receiptHandler = null;
    _fileHandler = null;

    @computed get participantUsernames() {
        if (!this.participants) return null;
        return this.participants.map(p => p.username);
    }

    @computed get chatName() {
        if (!this.participants) return '';
        return this.participants.length === 0
            ? User.current.username
            : this.participants.map(p => p.username).join(', ');
    }

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @param {ChatStore} store
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants, store) {
        this.id = id;
        this.store = store;
        if (!id) this.tempId = getTemporaryChatId();
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
    }

    loadMetadata() {
        if (this.metaLoaded || this.loadingMeta) return Promise.resolve();
        this.loadingMeta = true;
        return this.db.loadMeta()
            .then(action(() => {
                this.id = this.db.id;
                this.participants = this.db.participants;// todo computed
                this.loadingMeta = false;
                this.metaLoaded = true;
                this._messageHandler = new ChatMessageHandler(this);
                this._fileHandler = new ChatFileHandler(this);
                this._receiptHandler = new ChatReceiptHandler(this);
            }))
            .catch(err => {
                console.error(normalize(err, 'Error loading chat keg db metadata.'));
                this.loadingMeta = false;
            });
    }

    /**
     * Adds messages to current message list.
     * @param {Array<Object|Message>} kegs - list of messages to add
     * @param prepend - add message to top of bottom
     * @param sent - if true - array contains single item of Message type. This is a way to add sent messages.
     */
    @action addMessages(kegs, prepend = false, sent = false) {
        if (!kegs || !kegs.length) return;

        for (let i = 0; i < kegs.length; i++) {
            const keg = kegs[i];
            if (keg.deleted || this._messageMap[keg.kegId]) continue;

            const msg = sent ? keg : new Message(this.db).loadFromKeg(keg);
            // no payload for some reason. probably because of connection break after keg creation
            if (!sent && msg.isEmpty) continue;
            // array is gonna be sorted anyway, but just for the order or things
            if (prepend) {
                this.messages.unshift(msg);
            } else {
                this.messages.push(msg);
            }
            this._messageMap[msg.id] = msg;
        }

        this.sortMessages();

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
        this._sendReceipt();
        this._receiptHandler.applyReceipts();
    }

    // sorts messages in-place
    // we use insertion sorting because it's optimal for our mostly always sorted small array
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

    sendMessage(text, files) {
        if (this.canGoDown) this.reset();
        const m = new Message(this.db);
        m.files = files;
        // send() will fill message with data required for rendering
        const promise = m.send(text);
        this.limboMessages.push(m);
        when(() => !!m.id, action(() => {
            this.limboMessages.remove(m);
            m.tempId = null;
            // unless user already scrolled to high up, we add the message
            if (!this.canGoDown) this.addMessages([m], false, true);
        }));
        return promise;
    }


    sendAck() {
        // !! IN CASE YOUR EDITOR SHOWS THE STRING BELOW AS WHITESPACE !!
        // Know that it's not a whitespace, it's unicode :thumb_up: emoji
        return this.sendMessage('👍');
    }

    /**
     * Checks if this chat's participants are the same one that are passed
     * @param participants
     */
    hasSameParticipants(participants) {
        if (this.participants.length !== participants.length) return false;

        for (const p of participants) {
            if (!this.participants.includes(p)) return false;
        }
        return true;
    }


    uploadAndShareFile(path, name) {
        return this._fileHandler.uploadAndShare(path, name);
    }

    shareFiles(files) {
        return this._fileHandler.share(files);
    }

    loadMessages() {
        if (!this.metaLoaded) {
            this.loadMetadata().then(() => this.loadMessages());
        }
        this._messageHandler.getInitialPage()
            .then(() => this._messageHandler.onMessageDigestUpdate());
    }

    loadPreviousPage() {
        if (!this.canGoUp) return;
        this._messageHandler.getPage(true);
    }
    loadNextPage() {
        if (!this.canGoDown) return;
        this._messageHandler.getPage(false);
    }

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
                && prev.dayFingerprint === current.dayFingerprint) {
                current.groupWithPrevious = true;
            } else {
                current.groupWithPrevious = false;
            }
        }
    }


    _sendReceipt() {
        // messages are sorted at this point ;)
        if (!this.messages.length) return;
        this._receiptHandler.sendReceipt(+this.messages[this.messages.length - 1].id);
    }

}

module.exports = Chat;
