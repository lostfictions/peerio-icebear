const { observable } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');
const normalize = require('../errors').normalize;

class Chat {
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

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants) {
        this.id = id;
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
        this.loadMetadata();
    }

    loadMetadata() {
        if (this.loadingMeta) return;
        this.loadingMeta = true;
        this.db.loadMeta()
            .then(() => {
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
        if (this.loadingMessages) return;
        if (this.errorLoadingMeta || this.loadingMeta) {
            throw new Error('Can not load messages before meta. ' +
                `meta loading: ${this.loadingMeta}, meta err: ${this.errorLoadingMeta}`);
        }
        this.loadingMessages = true;
        this.db.getAllMessages().then(kegs => {
            for (const keg of kegs) {
                this.messages.push(Message.fromKeg(keg, this));
            }
            this.errorLoadingMessages = false;
            this.loadingMessages = false;
        }).catch(err => {
            console.log(normalize(err, 'Error loading messages.'));
            this.errorLoadingMessages = true;
            this.loadingMessages = false;
        });
    }

    // sendMessage(){

    // }

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
