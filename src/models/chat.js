const { observable, computed, action, reaction, autorunAsync } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');
const normalize = require('../errors').normalize;
const User = require('./user');
const tracker = require('./update-tracker');
const socket = require('../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');

// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

class Chat {
    @observable id=null;
    // Message objects
    @observable messages= [];
    msgMap = {};
    // initial metadata loading
    @observable loadingMeta = false;
    // initial messages loading
    @observable loadingMessages = false;
    // updating messages
    @observable updating = false;
    // currently selected/focused
    @observable active = false;

    // read positions in username:position format
    @observable receipts = {};

    // did chat fail to create/load?
    @observable errorLoadingMeta = false;
    // did messages fail to create/load?
    @observable errorLoadingMessages = false;
    metaLoaded = false;
    messagesLoaded = false;

    /** @type {Array<Contact>} */
    @observable participants=null;

    @computed get chatName() {
        if (!this.participants) return '';
        return this.participants.length === 0 ? User.current.username
                                              : this.participants.map(p => p.username).join(', ');
    }

    @observable unreadCount = tracker.getDigest(this.id, 'message').newKegsCount;

    downloadedUpdateId = 0;
    @observable maxUpdateId = tracker.getDigest(this.id, 'message').maxUpdateId;

    downloadedReceiptId = 0;

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

    onMessageDigestUpdate = _.throttle(() => {
        this.unreadCount = tracker.digest[this.id].message.newKegsCount;
        this.maxUpdateId = tracker.digest[this.id].message.maxUpdateId;
    }, 500);

    onReceiptDigestUpdate = _.throttle(() => {
        this._loadReceipts();
    }, 2000);

    loadMetadata() {
        if (this.metaLoaded || this.loadingMeta) return Promise.resolve();
        this.loadingMeta = true;
        return this.db.loadMeta()
            .then(action(() => {
                this.id = this.db.id;
                this.participants = this.db.participants;
                this.errorLoadingMeta = false;
                this.loadingMeta = false;
                this.metaLoaded = true;
                tracker.onKegTypeUpdated(this.id, 'message', this.onMessageDigestUpdate);
                tracker.onKegTypeUpdated(this.id, 'receipt', this.onReceiptDigestUpdate);
                this._loadReceipts();
            }))
            .catch(err => {
                console.error(normalize(err, 'Error loading chat keg db metadata.'));
                this.errorLoadingMeta = true;
                this.loadingMeta = false;
            });
    }

    /**
     * Returns  list of message kegs in this database starting from collection version
     * @returns {Promise<Array<MessageKeg>>}
     */
    _getMessages(min) {
        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: min || 0,
            query: { type: 'message' }
        });
    }

    loadMessages() {
        if (this.messagesLoaded || this.loadingMessages) return;
        if (!this.metaLoaded) {
            this.loadMetadata().then(() => this.loadMessages());
        }
        console.log(`Initial message load for ${this.id}`);
        this.loadingMessages = true;
        this._getMessages().then(action(kegs => {
            for (const keg of kegs) {
                if (!keg.isEmpty && !this.msgMap[keg.kegId]) {
                    const msg = new Message(this.db).loadFromKeg(keg);
                    if (msg) this.msgMap[keg.kegId] = this.messages.push(msg);
                }
                this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
            }
            this.messagesLoaded = true;
            this.errorLoadingMessages = false;
            this.loadingMessages = false;
            reaction(() => this.maxUpdateId, () => this.updateMessages(), false);
            autorunAsync(() => {
                if (this.unreadCount === 0 || !this.active) return;
                tracker.seenThis(this.id, 'message', this.downloadedUpdateId);
                this._sendReceipt(this.downloadedUpdateId);
            }, 700);
            this._sendReceipt(this.downloadedUpdateId);
        })).catch(err => {
            console.log(normalize(err, 'Error loading messages.'));
            this.errorLoadingMessages = true;
            this.loadingMessages = false;
        }).finally(() => this.updateMessages());
    }

    updateMessages() {
        if (!this.messagesLoaded || this.updating || this.loadingMessages
            || this.downloadedUpdateId >= this.maxUpdateId) return;
        console.log(`Updating messages for ${this.id} known: ${this.downloadedUpdateId}, max: ${this.maxUpdateId}`);
        this.updating = true;
        this._getMessages(this.downloadedUpdateId + 1)
            .then(kegs => {
                for (const keg of kegs) {
                    if (!keg.isEmpty && !this.msgMap[keg.kegId]) {
                        const msg = new Message(this.db).loadFromKeg(keg);
                        if (msg) this.msgMap[keg.kegId] = this.messages.push(msg);
                    }
                    this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
                }
                this.updating = false;
                if (kegs.length) this.store.onNewMessages();
            }).catch(err => {
                console.error('Failed to update messages.', err);
                this.updating = false;
            }).finally(() => this.updateMessages());
    }

    sendMessage(text, files) {
        const m = new Message(this.db);
        if (files) m.files = this._shareFiles(files);
        const promise = m.send(text);
        this.msgMap[m.tempId] = this.messages.push(m);
        return promise.then(() => {
            this.downloadedUpdateId = Math.max(this.downloadedUpdateId, m.collectionVersion);
            delete this.msgMap[m.tempId];
            this.msgMap[m.id] = m;
        });
    }

    sendAck() {
        return this.sendMessage('👍');// <- this is not a whitespace, it's unicode :thumb_up::
    }

    _shareFiles(files) {
        if (!files || !files.length) return null;
        const ids = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.participants.forEach(p => {
                if (p.isMe) return;
                // todo: handle failure
                file.share(p);
            });
            ids.push(file.fileId);
        }
        return ids;
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

    _sendReceipt(position) {
        this._loadOwnReceipt()
            .then(r => {
                if (r.position >= position) return;
                r.position = position;
                r.saveToServer()
                    .catch(err => {
                        // normally, this is a connection issue or concurrency.
                        // to resolve concurrency error we reload the cached keg
                        console.error(err);
                        this._ownReceipt = null;
                    });
            });
    }

    // loads or creates new receipt keg
    _loadOwnReceipt() {
        if (this._ownReceipt) return Promise.resolve(this._ownReceipt);

        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: 0,
            query: { type: 'receipt', username: User.current.username }
        }).then(res => {
            const r = new Receipt(this.db);
            if (res && res.length) {
                r.loadFromKeg(res[0]);
                return r;
            }
            r.username = User.current.username;
            r.position = 0;
            this._ownReceipt = r;
            return r.saveToServer().return(r);
        });
    }

    _loadReceipts() {
        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: this.downloadedReceiptId || 0,
            query: { type: 'receipt' }
        }).then(res => {
            if (!res && !res.length) return;
            const receipts = {};
            for (let i = 0; i < res.length; i++) {
                this.downloadedReceiptId = Math.max(this.downloadedReceiptId, res[i].collectionVersion);
                try {
                    const r = new Receipt(this.db);
                    r.loadFromKeg(res[i]);
                    receipts[r.username] = r.position;
                } catch (err) {
                    // we don't want to break everything for one faulty receipt
                    // also we don't want to log this, because in case of faulty receipt there will be
                    // too many logs
                }
            }
            this.receipts = receipts;
        });
    }

}

module.exports = Chat;
