const Keg = require('../kegs/keg');

class ReadReceipt extends Keg {

    constructor(username, db) {
        super(username ? `read_receipt-${username}` : null, 'read_receipt', db, false, false, true);
    }

    serializeKegPayload() {
        return {
            chatPosition: this.chatPosition
        };
    }

    deserializeKegPayload(payload) {
        this.chatPosition = payload.chatPosition || 0;
    }

    afterLoad() {
        this.receiptError = !this.id.endsWith(`-${this.owner}`);
    }

}

module.exports = ReadReceipt;
