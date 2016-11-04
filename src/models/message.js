const { observable } = require('mobx');
const contactStore = require('./contact-store');
const User = require('./user');

class Message {
    @observable sending = false;
    @observable sendError = false;

    constructor(chat, sender, text, timestamp) {
        this.chat = chat;
        this.sender = contactStore.getContact(sender);
        this.text = `${text} ${Math.random()}`;
        this.timestamp = timestamp;
        this.id = Math.random();
        if (sender === User.current.username) this.isOwn = true;
    }

    send() {
        this.sending = true;
        setTimeout(() => { this.sending = false; }, Math.random() * 1000);
    }

    static fromKeg(keg, chat) {
        return new Message(chat, keg.data.sender, keg.data.text, keg.data.timestamp);
    }
}

module.exports = Message;
