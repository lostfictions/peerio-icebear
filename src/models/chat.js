const { observable, computed, action, reaction, when } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');
const normalize = require('../errors').normalize;
const User = require('./user');
const tracker = require('./update-tracker');
const socket = require('../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');
const fileStore = require('./stores/file-store');
const config = require('../config');
const ChatState = require('./chat-state');

// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

class Chat {

    state = new ChatState();

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @param {ChatStore} store
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants, store) {
        this.state.id = id;
        this.store = store;
        if (!id) this.state.tempId = getTemporaryChatId();
        this.state.participants = participants;
        this.db = new ChatKegDb(id, participants);
    }

    onMessageDigestUpdate = _.throttle(() => {
        const msgDigest = tracker.getDigest(this.state.id, 'message');
        this.state.unreadCount = msgDigest.newKegsCount;
        this.state.maxUpdateId = msgDigest.maxUpdateId;
    }, 500);

    onReceiptDigestUpdate = _.throttle(() => {
        this._loadReceipts();
    }, 2000);

    loadMetadata() {
        if (this.state.metaLoaded || this.state.loadingMeta) return Promise.resolve();
        this.state.loadingMeta = true;
        return this.db.loadMeta()
            .then(action(() => {
                this.state.id = this.db.id;
                this.state.participants = this.db.participants;// todo computed
                this.state.loadingMeta = false;
                this.state.metaLoaded = true;
                tracker.onKegTypeUpdated(this.state.id, 'message', this.onMessageDigestUpdate);
                this.onMessageDigestUpdate();
                tracker.onKegTypeUpdated(this.id, 'receipt', this.onReceiptDigestUpdate);
                this.onReceiptDigestUpdate();
            }))
            .catch(err => {
                console.error(normalize(err, 'Error loading chat keg db metadata.'));
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
                    if (msg) {
                        this._detectFirstOfTheDayFlag(msg);
                        this.msgMap[keg.kegId] = this.messages.push(msg);
                    }
                }
                this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
            }
            this.messagesLoaded = true;
            this.errorLoadingMessages = false;
            this.loadingMessages = false;
            reaction(() => this.maxUpdateId, () => this.updateMessages(), false);
            reaction(() => [this.active, this.downloadedUpdateId], () => {
                if (!this.active) return;
                tracker.seenThis(this.id, 'message', this.downloadedUpdateId);
                // todo: this won't work properly with paging
                if (this.messages.length) this._sendReceipt(this.messages[this.messages.length - 1].id);
            }, { fireImmediately: true, delay: 2000 });
            this._loadReceipts();
        })).catch(err => {
            console.log(normalize(err, 'Error loading messages.'));
            this.errorLoadingMessages = true;
            this.loadingMessages = false;
        }).finally(() => this.updateMessages());
    }

    updateMessages() {
        if (!this.messagesLoaded || this.updatingMessages || this.loadingMessages
            || this.downloadedUpdateId >= this.maxUpdateId) return;
        console.log(`Updating messages for ${this.id} known: ${this.downloadedUpdateId}, max: ${this.maxUpdateId}`);
        this.updatingMessages = true;
        this._getMessages(this.downloadedUpdateId + 1)
            .then(kegs => {
                for (const keg of kegs) {
                    if (!keg.isEmpty && !this.msgMap[keg.kegId]) {
                        const msg = new Message(this.db).loadFromKeg(keg);

                        if (msg) {
                            this._detectFirstOfTheDayFlag(msg);
                            this.msgMap[keg.kegId] = this.messages.push(msg);
                        }
                    }
                    this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
                }
                this.updatingMessages = false;
                if (kegs.length) this.store.onNewMessages();
                this._applyReceipts();
            }).catch(err => {
                console.error('Failed to update messages.', err);
                this.updatingMessages = false;
            }).finally(() => this.updateMessages());
    }

    uploadAndShare(path, name) {
        const file = fileStore.upload(path, name);
        file.uploadQueue = this.uploadQueue;
        this.uploadQueue.push(file);
        when(() => file.readyForDownload, () => {
            this.uploadQueue.remove(file);
            this.sendMessage('', [file]);
        });
        return file;
    }

    sendMessage(text, files) {
        const m = new Message(this.db);
        if (files) m.files = this._shareFiles(files);
        const promise = m.send(text);
        this._detectFirstOfTheDayFlag(m);
        this.msgMap[m.tempId] = this.messages.push(m);
        return promise.then(() => {
            this.downloadedUpdateId = Math.max(this.downloadedUpdateId, m.collectionVersion);
            delete this.msgMap[m.tempId];
            this.msgMap[m.id] = m;
            this._sendReceipt(m.id);
        });
    }

    sendAck() {
        // !! IN CASE YOUR EDITOR SHOWS THE STRING BELOW AS WHITESPACE !!
        // Know that it's not a whitespace, it's unicode :thumb_up: emoji
        return this.sendMessage('👍');
    }

    _detectFirstOfTheDayFlag(msg) {
        if (!this.messages.length) {
            msg.firstOfTheDay = true;
            return;
        }
        const prev = this.messages[this.messages.length - 1];
        if (prev.timestamp.getDate() !== msg.timestamp.getDate()
            || prev.timestamp.getMonth() !== msg.timestamp.getMonth()
            || prev.timestamp.getYear() !== msg.timestamp.getYear()) {
            msg.firstOfTheDay = true;
        }
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

    // this flag means that something is currently being sent (in not null)
    // it might equal the actual receipt value being sent,
    // or a larger number that will be sent right after current one
    pendingReceipt = null;
    _sendReceipt(pos) {
        // console.debug('asked to send receipt: ', pos);
        // if something is currently in progress of sending we just want to adjust max value
        if (this.pendingReceipt) {
            this.pendingReceipt = Math.max(pos, this.pendingReceipt);
            // console.debug('receipt was pending. now pending: ', this.pendingReceipt);
            return; // will be send after current receipt finishes sending
        }
        // we don't want to send older receipt if newer one exists already
        // this shouldn't really happen, but it's safer this way
        pos = Math.max(pos, this.pendingReceipt); // eslint-disable-line no-param-reassign
        this.pendingReceipt = pos;
        // getting it from cache or from server
        this._loadOwnReceipt()
            .then(r => {
                if (r.position >= pos) {
                    // console.debug('receipt keg loaded but it has a higher position: ', pos, r.position);
                    // ups, keg has a bigger position then we are trying to save
                    // is our pending position also smaller?
                    if (r.position >= this.pendingReceipt) {
                        // console.debug('it is higher then pending one too:', this.pendingReceipt);
                        this.pendingReceipt = null;
                        return;
                    }
                    // console.debug('scheduling to save pending receipt instead: ', this.pendingReceipt);
                    const lastPending = this.pendingReceipt;
                    this.pendingReceipt = null;
                    this._sendReceipt(lastPending);
                }
                r.position = pos;
                // console.debug('Saving receipt: ', pos);
                return r.saveToServer() // eslint-disable-line
                    .catch(err => {
                        // normally, this is a connection issue or concurrency.
                        // to resolve concurrency error we reload the cached keg
                        console.error(err);
                        this._ownReceipt = null;
                    })
                    .finally(() => {
                        const lastPending = this.pendingReceipt;
                        this.pendingReceipt = null;
                        if (r.position < lastPending) {
                            // console.debug('scheduling to save pending receipt instead: ', lastPending);
                            this._sendReceipt(lastPending);
                        }
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
            for (let i = 0; i < res.length; i++) {
                this.downloadedReceiptId = Math.max(this.downloadedReceiptId, res[i].collectionVersion);
                try {
                    const r = new Receipt(this.db);
                    r.loadFromKeg(res[i]);
                    // todo: warn about signature error?
                    if (r.receiptError || r.signatureError || !r.username
                        || r.username === User.current.username || !r.position) continue;
                    this.receipts[r.username] = r.position;
                } catch (err) {
                    // we don't want to break everything for one faulty receipt
                    // also we don't want to log this, because in case of faulty receipt there will be
                    // too many logs
                    console.debug(err);
                }
            }
            this._applyReceipts();
        });
    }

    @action _applyReceipts() {
        const users = Object.keys(this.receipts);
        for (let i = 0; i < this.messages.length; i++) {
            const msg = this.messages[i];
            msg.receipts = null;
            for (let k = 0; k < users.length; k++) {
                const username = users[k];
                if (+msg.id !== this.receipts[username]) continue;
                msg.receipts = msg.receipts || [];
                msg.receipts.push(username);
            }
        }
    }

    getPage(offset, count) {
        return socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.db.id,
            options: {
                type: 'message',
                reverse: true,
                offset,
                count
            }
        });
    }


}

module.exports = Chat;
