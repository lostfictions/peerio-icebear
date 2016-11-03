const { observable } = require('mobx');
const contactStore = require('../stores/contact-store');
const User = require('./user');

class Message {
    @observable sending = false;
    @observable sendError = false;

    constructor(sender, text, timestamp) {
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
}

module.exports = Message;
