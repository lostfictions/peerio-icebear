const { observable, action } = require('mobx');
const contactStore = require('./contact-store');
const User = require('./user');
const MessageKeg = require('./kegs/message-keg');

// to assign when sending a message and don't have an id yet
let temporaryMessageId = 0;
function getTemporaryMessageId() {
    return `sending:${temporaryMessageId++}`;
}

class Message {
    @observable sending = false;
    @observable sendError = false;

    /**
     * @param {[string]} id - keg id
     * @param {ChatStore} chat - owner of this message
     * @param {string} sender - username of message sender
     * @param {string} text - message text
     * @param {Date} timestamp - message creation timestamp
     */
    constructor(id, chat, sender, text, timestamp) {
        this.id = id;
        if (!id) this.tempId = getTemporaryMessageId();
        this.chat = chat;
        this.sender = contactStore.getContact(sender);
        this.text = text;
        this.timestamp = timestamp;
        if (sender === User.current.username) this.isOwn = true;
    }

    send() {
        this.sending = true;
        const keg = new MessageKeg(this.chat.db);
        keg.data = {
            sender: this.sender.username,
            text: this.text,
            isAck: !!this.isAck,
            timestamp: this.timestamp.valueOf()
        };
        keg.create().then(() => {
            this.id = keg.id;
            this.sending = false;
        }).catch(action(err => {
            this.sending = false;
            this.sendError = true;
            console.error('Error sending message', err);
        }));
    }

    static fromKeg(keg, chat) {
        return new Message(keg.id, chat, keg.data.sender, keg.data.text, new Date(keg.data.timestamp));
    }
}

module.exports = Message;
