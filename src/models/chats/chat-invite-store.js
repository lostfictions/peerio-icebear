const { observable, action, when } = require('mobx');
const socket = require('../../network/socket');
const warnings = require('../warnings');
const chatStore = require('./chat-store'); // todo: DI module
const { ChatBootKeg } = require('../kegs/chat-boot-keg');
const { cryptoUtil, publicCrypto } = require('../../crypto');
const User = require('../user/user');
const Keg = require('../kegs/keg');

// this is not... the most amazing code reuse, but it works, and it's clear
class ChatHead extends Keg {
    constructor(db) {
        super('chat_head', 'chat_head', db);
    }
    chatName = '';

    deserializeKegPayload(payload) {
        this.chatName = payload.chatName || '';
    }
}

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
                this.sent.clear();
                res.forEach(item => {
                    let arr = this.sent.get(item.kegDbId);
                    if (!arr) {
                        this.sent.set(item.kegDbId, []);
                        arr = this.sent.get(item.kegDbId);
                    }
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
                    const channelName = this.decryptChannelName(i);
                    return { username: i.admin, kegDbId: i.channel, timestamp: i.timestamp, channelName };
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
                        // todo: move somewhere
                        const chat = chatStore.chatMap[kegDbId];
                        if (!chat) return;
                        when(() => chat.metaLoaded, () => {
                            chat.removeParticipant(username, false);
                        });
                    });
                }
            }));
    };

    /**
     * @param {Object} data - invite objects
     * @returns {string}
     * @private
     */
    decryptChannelName(data) {
        try {
            const { bootKeg, chatHeadKeg } = data;
            bootKeg.payload = JSON.parse(bootKeg.payload);
            const keyId = (chatHeadKeg.keyId || 0).toString();
            const publicKey = cryptoUtil.b64ToBytes(bootKeg.payload.publicKey);
            let encKegKey = bootKeg.payload.encryptedKeys[keyId].keys[User.current.username];
            encKegKey = cryptoUtil.b64ToBytes(encKegKey);

            const kegKey = publicCrypto.decrypt(encKegKey, publicKey, User.current.encryptionKeys.secretKey);
            const fakeDb = { id: data.channel };
            const chatHead = new ChatHead(fakeDb);
            chatHead.overrideKey = kegKey;
            chatHead.loadFromKeg(chatHeadKeg);
            return chatHead.chatName;
        } catch (ex) {
            console.error(ex);
            return '';
        }
    }
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
                when(() => {
                    const chat = chatStore.chats.find(c => c.id === kegDbId);
                    if (!chat) return false;
                    return chat.metaLoaded;
                }, () => {
                    chatStore.chatMap[kegDbId].sendJoinMessage();
                    if (!chatStore.activeChat) {
                        chatStore.activate(kegDbId);
                    }
                });
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
