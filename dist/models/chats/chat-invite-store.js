'use strict';

var _dec, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

const { observable, action, when } = require('mobx');
const socket = require('../../network/socket');
const warnings = require('../warnings');
const { getChatStore } = require('../../helpers/di-chat-store');
const { cryptoUtil, publicCrypto } = require('../../crypto');
const User = require('../user/user');
const Keg = require('../kegs/keg');
const { getUser } = require('../../helpers/di-current-user');

// this is not... the most amazing code reuse, but it works, and it's clear
let ChatHead = class ChatHead extends Keg {
    constructor(db) {
        super('chat_head', 'chat_head', db);
        this.chatName = '';
    }


    deserializeKegPayload(payload) {
        this.chatName = payload.chatName || '';
    }
};

/**
 * Chat invites store. Contains lists of incoming and outgoing invites and operations on them.
 * @namespace
 * @public
 */

let ChatInviteStore = (_dec = observable.shallow, (_class2 = class ChatInviteStore {
    constructor() {
        _initDefineProp(this, 'received', _descriptor, this);

        _initDefineProp(this, 'sent', _descriptor2, this);

        _initDefineProp(this, 'left', _descriptor3, this);

        _initDefineProp(this, 'rejected', _descriptor4, this);

        this.updating = false;
        this.updateAgain = false;

        this.updateInvitees = () => {
            return socket.send('/auth/kegs/channel/invitees').then(action(res => {
                this.sent.clear();
                this.rejected.clear();
                res.forEach(item => {
                    // regular invites
                    let arr = this.sent.get(item.kegDbId);
                    if (!arr) {
                        this.sent.set(item.kegDbId, []);
                        arr = this.sent.get(item.kegDbId);
                    }
                    Object.keys(item.invitees).forEach(username => {
                        if (item.rejected[username]) return;
                        arr.push({ username, timestamp: item.invitees[username] });
                    });
                    arr.sort((i1, i2) => i1.username.localeCompare(i2.username));

                    const rejectedUsernames = Object.keys(item.rejected);
                    this.rejected.set(item.kegDbId, rejectedUsernames);

                    Promise.map(rejectedUsernames, username => this.revokeInvite(item.kegDbId, username, true), { concurrency: 1 });
                });
            }));
        };

        this.updateInvites = () => {
            return socket.send('/auth/kegs/channel/invites').then(action(res => {
                this.received = res.map(i => {
                    const channelName = this.decryptChannelName(i);
                    return { username: i.admin, kegDbId: i.channel, timestamp: i.timestamp, channelName };
                });
            }));
        };

        this.updateLeftUsers = () => {
            return socket.send('/auth/kegs/channel/users-left').then(action(res => {
                this.left.clear();
                for (const kegDbId in res) {
                    const leavers = res[kegDbId];
                    if (!leavers || !leavers.length) continue;
                    this.left.set(kegDbId, leavers.map(l => {
                        return { username: l };
                    }));
                    getChatStore().getChatWhenReady(kegDbId).then(chat => {
                        if (!chat.canIAdmin) return;
                        Promise.map(leavers, l => chat.removeParticipant(l, false), { concurrency: 1 });
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }));
        };

        this.update = () => {
            if (this.updating) {
                this.updateAgain = true;
                return;
            }
            this.updateAgain = false;
            if (!socket.authenticated) return;
            this.updating = true;

            try {
                this.updateInvitees().then(this.updateInvites).then(this.updateLeftUsers).catch(err => {
                    console.error('Error updating invite store', err);
                }).finally(() => {
                    this.afterUpdate();
                });
            } catch (err) {
                console.error('Error updating invite store', err);
            } finally {
                this.afterUpdate();
            }
        };

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


    /**
     * List of channel invites admins of current channel have sent.
     * @member {Map<kegDbId: string, [{username: string, timestamp: number}]>} sent
     * @memberof ChatInviteStore
     * @instance
     * @public
     */


    /**
     * List of users requested to leave channels. This is normally for internal icebear use.
     * Icebear will monitor this list and remove keys from boot keg for leavers
     * if current user is an admin of specific channel. Then icebear will remove an item from this list.
     * todo: the whole system smells a bit, maybe think of something better
     * @member {Map<{kegDbId: string, username: string}>} left
     * @memberof ChatInviteStore
     * @instance
     * @protected
     */


    /**
     * List of users who rejected invites and are pending to be removed from boot keg.
     * @member {Map<{kegDbId: string, username: string}>} rejected
     * @memberof ChatInviteStore
     * @instance
     * @protected
     */


    /** @private */


    /** @private */


    /** @private */


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
        if (getUser().channelsLeft === 0) {
            warnings.add('error_acceptChannelInvite');
            return Promise.reject(new Error('Channel limit reached'));
        }
        return socket.send('/auth/kegs/channel/invite/accept', { kegDbId }).then(() => {
            return new Promise(resolve => {
                when(() => {
                    const chat = getChatStore().chats.find(c => c.id === kegDbId);
                    if (!chat) return false;
                    return chat.metaLoaded;
                }, () => {
                    getChatStore().chatMap[kegDbId].sendJoinMessage();
                    resolve();
                });
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
        return socket.send('/auth/kegs/channel/invite/reject', { kegDbId }).catch(err => {
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
    revokeInvite(kegDbId, username, noWarning = false) {
        return getChatStore().getChatWhenReady(kegDbId).then(chat => {
            if (!chat.canIAdmin) return Promise.resolve();
            return chat.removeParticipant(username, false).catch(err => {
                console.error(err);
                if (!noWarning) {
                    warnings.add('error_revokeChannelInvite');
                }
            });
        });
    }
}, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'received', [_dec], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'sent', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowMap();
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'left', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowMap();
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'rejected', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowMap();
    }
})), _class2));


module.exports = new ChatInviteStore();