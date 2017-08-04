const { observable, action } = require('mobx');
const socket = require('../../network/socket');
const warnings = require('../warnings');

/**
 * Chat invites store. Contains lists of incoming and outgoing invites and operations on them.
 * @namespace
 * @public
 */
class ChatInviteStore {
    constructor() {
        socket.onceStarted(() => {
            socket.subscribe('channelInvitesUpdate', this.update);
            socket.onAuthenticated(this.update);
        });
    }
    /**
     * List of channel ids current user has been invited to.
     * @member {ObservableArray<{kegDbId: string, username: string, timestamp: number}>} received
     * @memberof ChatInviteStore
     * @instance
     * @public
     */
    @observable.shallow received = [];
    /**
     * List of channel invites current user has sent.
     * @member {ObservableArray<{kegDbId: string, username: string, timestamp: number}>} sent
     * @memberof ChatInviteStore
     * @instance
     * @public
     */
    @observable.shallow sent = [];

    /**
     * List of users requested to leave channels. This is normally for internal icebear use.
     * Icebear will monitor this list and remove keys from boot keg for leavers
     * if current user is an admin of specific channel. Then icebear will remove an item from this list.
     * todo: the whole system smells a bit, maybe think of something better
     * @member {ObservableArray<{kegDbId: string, username: string}>} left
     * @memberof ChatInviteStore
     * @instance
     * @protected
     */
    @observable.shallow left = [];

    updating = false;
    updateAgain = false;

    /**
     * Updates local data from server.
     * @function
     * @memberof ChatInviteStore
     * @private
     */
    update = () => {
        if (this.updating) {
            this.updateAgain = true;
            return;
        }
        this.updateAgain = false;
        if (!socket.authenticated) return;
        this.updating = true;

        try {
            socket.send('/auth/kegs/channel/invitees')
                .then(action(res => {
                    this.sent = [];
                    res.forEach(item => {
                        item.invitees.forEach(username => {
                            this.sent.push({ username, kegDbId: item.kegDbId, timestamp: item.timestamp });
                        });
                    });
                }))
                .then(() => {
                    return socket.send('/auth/kegs/channel/invites');
                })
                .then(action(res => {
                    this.received = res.map(i => {
                        return { username: i.username, kegDbId: i/* .kegDbId */, timestamp: i.timestamp };
                    });
                    return socket.send('/auth/kegs/channel/users-left');
                }))
                .then(action(res => {
                    this.left = [];
                    for (const kegDbId in res) {
                        const leavers = res[kegDbId];
                        if (!leavers || !leavers.length) continue;
                        leavers.forEach(username => {
                            this.left.push({ kegDbId, username });
                        });
                    }
                }))
                .catch(err => {
                    console.error('Error updating invite store', err);
                })
                .finally(() => {
                    this.afterUpdate();
                });
        } catch (err) {
            console.error('Error updating invite store', err);
        } finally {
            this.afterUpdate();
        }
    };

    /**
     * @private
     */
    afterUpdate() {
        this.updating = false;
        if (this.updateAgain === false) return;
        setTimeout(this.update);
    }

    /**
     * @param {string} kegDbId
     * @public
     */
    acceptInvite(kegDbId) {
        return socket.send('/auth/kegs/channel/invite/accept', { kegDbId })
            .then(() => {
                // todo: not sure if server send an event
                // this.update();
            }).catch(err => {
                console.error('Failed to accept invite', kegDbId, err);
                warnings.add('error_acceptChannelInvite');
                return Promise.reject(err);
            });
    }

    /**
     * @param {string} kegDbId
     * @public
     */
    rejectInvite(kegDbId) {
        return socket.send('/auth/kegs/channel/invite/reject', { kegDbId })
            .then(() => {
                // todo: not sure if server send an event
                // this.update();
            }).catch(err => {
                console.error('Failed to accept invite', kegDbId, err);
                warnings.add('error_rejectChannelInvite');
                return Promise.reject(err);
            });
    }

    /**
     * @param {string} kegDbId
     * @param {string} username
     * @public
     */
    revokeInvite(kegDbId, username) {

    }
}

module.exports = new ChatInviteStore();
