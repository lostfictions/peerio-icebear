const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');
const _ = require('lodash');
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
        this.issued = _.uniqWith(payload.issued, this._compareinvites);
    }

    _compareinvites(a, b) {
        return a.email === b.email;
    }

}


module.exports = Invites;
