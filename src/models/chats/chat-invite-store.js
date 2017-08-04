const { observable, action } = require('mobx');
const socket = require('../../network/socket');

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
    @observable received = [];
    /**
     * List of channel invites current user has sent.
     * @member {ObservableArray<{kegDbId: string, username: string, timestamp: number}>} sent
     * @memberof ChatInviteStore
     * @instance
     * @public
     */
    @observable sent = [];

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
}

module.exports = new ChatInviteStore();
