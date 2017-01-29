const { observable, computed, action, reaction, autorunAsync } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');
const normalize = require('../errors').normalize;
const User = require('./user');
const tracker = require('./update-tracker');
const socket = require('../network/socket');
const File = require('./files/file');

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

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants, store) {
        this.id = id;
        this.store = store;
        if (!id) this.tempId = getTemporaryChatId();
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
    }

    onMessageDigestUpdate = () => {
        this.unreadCount = tracker.digest[this.id].message.newKegsCount;
        this.maxUpdateId = tracker.digest[this.id].message.maxUpdateId;
    };

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
                if (keg.version !== 1 && !this.msgMap[keg.kegId]) {
                    const msg = new Message(this).loadFromKeg(keg);
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
            }, 700);
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
                    if (keg.version !== 1 && !this.msgMap[keg.kegId]) {
                        const msg = new Message(this).loadFromKeg(keg);
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
        const m = new Message(this);
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
            const source = files[i];
            const f = new File(this.db);
            f.deserializeKegPayload(source.serializeKegPayload());
            f.deserializeProps(source.serializeProps());
            if (!f.fileOwner) f.fileOwner = User.current.username;
            f.saveToServer();
            ids.push(f.fileId);
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

}

module.exports = Chat;
