const { observable } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('./kegs/chat-keg-db');

class Chat {
    // Message objects
    @observable messages = [];
    // initial messages and metadata loading
    @observable loading = false;
    // currently selected/focused
    @observable active = false;

    /**
     * @param {string} id - chat id
     * @param {Array<string>} participants - chat participants
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants) {
        this.id = id;
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
    }

    load() {
        this.loading = true;

        this.loading = false;
    }
}

module.exports = Chat;
