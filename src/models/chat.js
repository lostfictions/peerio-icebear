const { observable } = require('mobx');
const Message = require('./message');

class Chat {
    // Message objects
    @observable messages = [];
    @observable loading = false;
    @observable active = false;

    constructor(id, participants) {
        this.id = id;
        this.participants = participants || ['user1', 'user2'];
    }

    load() {
        this.loading = true;
        setTimeout(() => {
            while (Math.random() < 0.7) {
                const msg = new Message(this.participants[Math.floor(Math.random() * this.participants.length)],
                'such a message', Date.now());
                this.messages.push(msg);
            }
            this.loading = false;
        }, 1000);
    }
}

module.exports = Chat;
