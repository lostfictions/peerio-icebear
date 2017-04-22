const Keg = require('../kegs/keg');

// Chat head keg is open for any chat participant to update.
class ChatHead extends Keg {

    constructor(db) {
        super('chat_head', 'chat_head', db);
    }
    serializeKegPayload() {
        return {
            chatName: this.chatName
        };
    }

    deserializeKegPayload(payload) {
        this.chatName = payload.chatName;
    }
}


module.exports = ChatHead;
