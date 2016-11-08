const { observable, computed } = require('mobx');
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
    @observable messages = [];
    // initial metadata loading
    @observable loadingMeta = false;
    // initial messages loading
    @observable loadingMessages = false;
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
        this.loadingMessages = true;
        this.db.getAllMessages().then(kegs => {
            for (const keg of kegs) {
                this.messages.push(Message.fromKeg(keg, this));
            }
            this.messagesLoaded = true;
            this.errorLoadingMessages = false;
            this.loadingMessages = false;
        }).catch(err => {
            console.log(normalize(err, 'Error loading messages.'));
            this.errorLoadingMessages = true;
            this.loadingMessages = false;
        });
    }

    /**
     *
     * @param text
     */
    sendMessage(text) {
        const m = new Message(null, this, User.current.username, text, new Date());
        m.send();
        this.messages.push(m);
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
