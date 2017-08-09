const { observable, action, Map } = require('mobx');
const socket = require('../../network/socket');
const warnings = require('../warnings');
const chatStore = require('./chat-store'); // todo: DI module


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
     * @member {Map<kegDbId: string, [{username: string, timestamp: number}]>} sent
     * @memberof ChatInviteStore
     * @instance
     * @public
     */
    @observable sent = observable.map();

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

    /** @private */
    updateInvitees = () => {
        return socket.send('/auth/kegs/channel/invitees')
            .then(action(res => {
                res.forEach(item => {
                    let arr = this.sent.get(item.kegDbId);
                    if (!arr) {
                        this.sent.set(item.kegDbId, []);
                        arr = this.sent.get(item.kegDbId);
                    }
                    arr.clear();
                    Object.keys(item.invitees).forEach(username => {
                        arr.push({ username, timestamp: item.invitees[username] });
                    });
                });
            }));
    };

    /** @private */
    updateInvites = () => {
        return socket.send('/auth/kegs/channel/invites')
            .then(action(res => {
                this.received = res.map(i => {
                    return { username: i.admin, kegDbId: i.channel, timestamp: i.timestamp };
                });
            }));
    };

    /** @private */
    updateLeftUsers = () => {
        return socket.send('/auth/kegs/channel/users-left')
            .then(action(res => {
                this.left = [];
                for (const kegDbId in res) {
                    const leavers = res[kegDbId];
                    if (!leavers || !leavers.length) continue;
                    leavers.forEach(username => {
                        this.left.push({ kegDbId, username });
                    });
                }
            }));
    };
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
            this.updateInvitees()
                .then(this.updateInvites)
                .then(this.updateLeftUsers)
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
                setTimeout(this.update, 250);
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
                setTimeout(this.update, 250);
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
        const chat = chatStore.chatMap[kegDbId];
        if (!chat || !chat.metaLoaded) {
            console.error(chat ? 'Can not revoke invite on chat that is still loading'
                : 'Can not find chat in store to revoke invite', kegDbId);
            warnings.add('error_revokeChannelInvite');
            return Promise.reject();
        }
        return chat.removeParticipant(username).then(() => {
            setTimeout(this.update, 250);
        });
    }
}

module.exports = new ChatInviteStore();
