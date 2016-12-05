const { observable } = require('mobx');
const contactStore = require('./contact-store');
const User = require('./user');
const Keg = require('./kegs/keg');

class Message extends Keg {
    @observable sending = false;
    @observable sendError = false;

    /**
     * @param {ChatStore} chat - chat store owner of this message
     */
    constructor(chat) {
        super(null, 'message', chat.db);
    }

    send(text, isAck) {
        this.sending = true;
        this.assignTemporaryId();
        this.sender = contactStore.getContact(User.current.username);
        this.text = text;
        this.isAck = !!isAck;
        this.timestamp = new Date();
        return this.saveToServer()
            .catch(err => {
                this.sendError = true;
                console.error('Error sending message', err);
                return Promise.reject(err);
            })
            .finally(() => {
                this.sending = false;
                // todo: remove tempId ?
            });
    }

    serializeKegPayload() {
        return {
            sender: this.sender.username,
            text: this.text,
            isAck: !!this.isAck,
            timestamp: this.timestamp.valueOf()
        };
    }

    deserializeKegPayload(payload) {
        this.sender = contactStore.getContact(payload.sender);
        this.text = payload.text;
        this.isAck = payload.isAck;
        this.timestamp = new Date(payload.timestamp);
    }
}

module.exports = Message;
