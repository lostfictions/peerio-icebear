const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');
const _ = require('lodash');

/**
 * Named readonly server-controlled keg. Contains data about contacts invited by email.
 * Invite data can be modified via separate api.
 * @extends {SyncedKeg}
 * @public
 */
class Invites extends SyncedKeg {
    /**
     * @member {Array<InvitedContact>}
     * @protected
     */
    issued = [];
    /**
     * Usernames of users invited us before we created an account.
     * @member {Array<string>}
     * @protected
     */
    received = [];
    /**
     * Channel invites
     * @member {Array<{email:[{channelId:string, admin:string, added:number}]}>>}
     * @protected
     */
    channels = []
    constructor() {
        super('invites', getUser().kegDb, true);
    }

    serializeKegPayload() {
        throw new Error('Read only keg is not supposed to be saved.');
    }

    deserializeKegPayload(payload) {
        this.issued = _.uniqWith(payload.issued, this._compareInvites);
        this.received = _.uniq(
            Object.keys(payload.received)
                .reduce((acc, email) => acc.concat(payload.received[email]), [])
                .map(item => item.username)
        );
        if (!payload.channels) return;
        this.channels = Object.keys(payload.channels)
            .map(email => (payload.channels[email].length ? { [email]: payload.channels[email] } : null))
            .filter(item => !!item);
    }

    _compareInvites(a, b) {
        return a.email === b.email;
    }
}


module.exports = Invites;
