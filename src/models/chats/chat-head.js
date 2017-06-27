const SyncedKeg = require('../kegs/synced-keg');
const { observable } = require('mobx');

/**
 * Chat head keg is open for any chat participant to update.
 * @param {ChatKegDb} db
 * @extends SyncedKeg
 * @public
 */
class ChatHead extends SyncedKeg {
    constructor(db) {
        super('chat_head', db);
    }

    /**
     * @member {string} chatName
     * @memberof ChatHead
     * @instance
     * @public
     */
    @observable chatName = '';


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
