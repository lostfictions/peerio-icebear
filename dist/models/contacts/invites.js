'use strict';

const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');
const _ = require('lodash');

/**
 * Named readonly server-controlled keg. Contains data about contacts invited by email.
 * Invite data can be modified via separate api.
 * @extends {SyncedKeg}
 * @public
 */
let Invites = class Invites extends SyncedKeg {
    /**
     * @member {Array<InvitedContact>}
     * @public
     */
    constructor() {
        super('invites', getUser().kegDb, true);
        this.issued = [];
        this.received = [];
    }
    /**
     * Usernames of users invited us before we created an account.
     * @member {Array<string>}
     */


    serializeKegPayload() {
        throw new Error('Read only keg is not supposed to be saved.');
    }

    deserializeKegPayload(payload) {
        this.issued = _.uniqWith(payload.issued, this._compareInvites);
        this.received = _.uniq(Object.keys(payload.received).reduce((acc, email) => acc.concat(payload.received[email]), []).map(item => item.username));
    }

    _compareInvites(a, b) {
        return a.email === b.email;
    }
};


module.exports = Invites;