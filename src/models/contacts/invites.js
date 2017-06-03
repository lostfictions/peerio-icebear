const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');

// List of user's chats macro data/flags
class Invites extends SyncedKeg {

    issued = [];

    constructor() {
        super('invites', getUser().kegDb, true);
    }

    serializeKegPayload() {
        throw new Error('Read only keg is not supposed to be saved.');
    }

    deserializeKegPayload(payload) {
        this.issued = payload.issued;
    }

}


module.exports = Invites;
