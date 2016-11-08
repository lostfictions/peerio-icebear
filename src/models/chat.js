const { observable, computed, asMap, when, reaction } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');
const normalize = require('../errors').normalize;
const User = require('./user');
const tracker = require('./update-tracker');

// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

class Chat {
    @observable id=null;
    // Message objects
    @computed get messages() {
        return this.msgMap.values();
    }
    @observable msgMap= asMap();
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
    messagesLoaded = false;
    /** @type {Array<Contact>} */
    @observable participants=null;

    @computed get chatName() {
        if (!this.participants) return '';
        return this.participants.length === 0 ? User.current.username
                                            : this.participants.map(p => p.username).join(', ');
    }

    @computed get unreadCount() {
        if (!this.id) return 0;
        if (!tracker.data.has(this.id)) return 0;
        return tracker.data.get(this.id).message.newKegsCount;
    }
    downloadedUpdateId =0;
    @computed get maxUpdateId() {
        if (!this.id) return 0;
        if (!tracker.data.has(this.id)) return 0;
        return tracker.data.get(this.id).message.maxUpdateId;
    }

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants) {
        this.id = id;
        if (!id) this.tempId = getTemporaryChatId();
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
        this.loadMetadata();
        reaction(() => this.maxUpdateId, () => this.updateMessages(), false, 500);
    }

    loadMetadata() {
        if (this.loadingMeta) return;
        this.loadingMeta = true;
        this.db.loadMeta()
            .then(() => {
                this.id = this.db.id;
                this.participants = this.db.participants;
                this.errorLoadingMeta = false;
                this.loadingMeta = false;
            })
            .catch(err => {
                console.error(normalize(err, 'Error loading chat keg db metadata.'));
                this.errorLoadingMeta = true;
                this.loadingMeta = false;
            });
    }

    loadMessages() {
        if (this.messagesLoaded || this.loadingMessages) return;
        if (this.errorLoadingMeta || this.loadingMeta) {
            throw new Error('Can not load messages before meta. ' +
                `meta loading: ${this.loadingMeta}, meta err: ${this.errorLoadingMeta}`);
        }
        console.log(`Initial message load for ${this.id}`);
        this.loadingMessages = true;
        this.db.getMessages().then(kegs => {
            for (const keg of kegs) {
                if (keg.version !== 1) this.msgMap.set(keg.kegId, new Message(this).loadFromKeg(keg));
                this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
            }
            this.messagesLoaded = true;
            this.errorLoadingMessages = false;
            this.loadingMessages = false;
        }).catch(err => {
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
        this.db.getMessages(this.downloadedUpdateId + 1)
            .then(kegs => {
                for (const keg of kegs) {
                    if (keg.version !== 1) this.msgMap.set(keg.kegId, new Message(this).loadFromKeg(keg));
                    this.downloadedUpdateId = Math.max(this.downloadedUpdateId, keg.collectionVersion);
                }
                this.updating = false;
            }).catch(err => {
                console.error('Failed to update messages.', err);
                this.updating = false;
            }).finally(() => this.updateMessages());
    }

    /**
     *
     * @param text
     */
    sendMessage(text) {
        const m = new Message(this);
        m.send(text);
        this.msgMap.set(m.tempId, m);
        when(() => !m.sending, () => {
            this.downloadedUpdateId = Math.max(this.downloadedUpdateId, m.collectionVersion);
            this.msgMap.delete(m.tempId);
            this.msgMap.set(m.id, m);
        });
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
