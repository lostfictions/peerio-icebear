const SyncedKeg = require('../kegs/synced-keg');
const { observable } = require('mobx');

// Chat head keg is open for any chat participant to update.
class ChatHead extends SyncedKeg {
    @observable chatName = '';

    constructor(db) {
        super('chat_head', db);
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
