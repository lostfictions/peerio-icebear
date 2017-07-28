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
    /**
     * @member {string} purpose
     * @memberof ChatHead
     * @instance
     * @public
     */
    @observable purpose = '';


    serializeKegPayload() {
        return {
            chatName: this.chatName,
            purpose: this.purpose
        };
    }

    deserializeKegPayload(payload) {
        this.chatName = payload.chatName || '';
        this.purpose = payload.purpose || '';
    }
}


module.exports = ChatHead;
