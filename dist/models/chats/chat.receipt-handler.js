'use strict';

var _desc, _value, _class;

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

const { action, reaction, observable } = require('mobx');
const User = require('../user/user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const ReadReceipt = require('./read-receipt');
const { retryUntilSuccess } = require('../../helpers/retry');
const TaskQueue = require('../../helpers/task-queue');

/**
 *
 * @param {Chat} chat - chat creates instance and passes itself to the constructor.
 * @protected
 */

let ChatReceiptHandler = (_class = class ChatReceiptHandler {

    constructor(chat) {
        this.downloadedCollectionVersion = '';
        this.pendingReceipt = null;
        this._reactionsToDispose = [];
        this.loadQueue = new TaskQueue(1, 1000);

        this.onDigestUpdate = () => {
            if (!this.chat.active) return;
            this.loadQueue.addTask(this.loadReceipts);
        };

        this.loadOwnReceipt = () => {
            if (this._ownReceipt) return Promise.resolve(this._ownReceipt);
            this._ownReceipt = new ReadReceipt(User.current.username, this.chat.db);
            return retryUntilSuccess(() => this._ownReceipt.load()).then(() => {
                if (!this._ownReceipt.chatPosition) this._ownReceipt.chatPosition = 0;
                return this._ownReceipt;
            });
        };

        this.loadReceipts = () => {
            let digest = tracker.getDigest(this.chat.id, 'read_receipt');
            if (digest.maxUpdateId <= this.downloadedCollectionVersion) return null;
            const filter = this.downloadedCollectionVersion ? { minCollectionVersion: this.downloadedCollectionVersion } : {};
            return socket.send('/auth/kegs/db/list-ext', {
                kegDbId: this.chat.id,
                options: {
                    type: 'read_receipt',
                    reverse: false
                },
                filter
            }).then(res => {
                const kegs = res.kegs;
                if (!kegs || !kegs.length) return;
                for (let i = 0; i < kegs.length; i++) {
                    if (kegs[i].collectionVersion > this.downloadedCollectionVersion) {
                        this.downloadedCollectionVersion = kegs[i].collectionVersion;
                    }
                    try {
                        const r = new ReadReceipt(null, this.chat.db);
                        r.loadFromKeg(kegs[i]);
                        if (r.owner === User.current.username) {
                            if (this._ownReceipt && this._ownReceipt.version < r.version) {
                                this._ownReceipt = r;
                            }
                        } else {
                            this.chat.receipts.set(r.owner, r);
                        }
                    } catch (err) {
                        // we don't want to break everything for one faulty receipt
                        console.error(err);
                    }
                }
                digest = tracker.getDigest(this.chat.id, 'read_receipt');
                if (digest.knownUpdateId < digest.maxUpdateId) {
                    tracker.seenThis(this.chat.id, 'read_receipt', digest.maxUpdateId);
                }
                this.applyReceipts();
            });
        };

        this.chat = chat;
        // receipts cache {username: ReadReceipt}
        this.chat.receipts = observable.shallowMap();
        tracker.onKegTypeUpdated(chat.id, 'read_receipt', this.onDigestUpdate);
        this.onDigestUpdate();
        this._reactionsToDispose.push(reaction(() => socket.authenticated, authenticated => {
            if (authenticated) this.onDigestUpdate();
            if (!authenticated || !this.pendingReceipt) return;
            const pos = this.pendingReceipt;
            this.pendingReceipt = null;
            this.sendReceipt(pos);
        }));
        this._reactionsToDispose.push(reaction(() => this.chat.active, active => {
            if (active) this.onDigestUpdate();
        }));
    }
    // this value means that something is scheduled to send

    /**
     * Sends receipt for message id seen
     * @param {string} pos
     * @protected
     */
    sendReceipt(pos) {
        // console.debug(`sendReceipt(${pos})`);
        pos = +pos; // eslint-disable-line no-param-reassign
        // console.debug('asked to send receipt: ', pos);
        // if something is currently in progress of sending we just want to adjust max value
        if (this.pendingReceipt) {
            // console.debug('Pending receipt exists ', this.pendingReceipt);
            // we don't want to send older receipt if newer one exists already
            this.pendingReceipt = Math.max(pos, this.pendingReceipt);
            // console.debug('receipt was pending. now pending: ', this.pendingReceipt);
            return; // will be send after current receipt finishes sending
        }
        this.pendingReceipt = pos;
        // getting it from cache or from server
        retryUntilSuccess(this.loadOwnReceipt).then(r => {
            // console.debug('Loaded own receipt pos: ', r.chatPosition, ' pending: ', this.pendingReceipt);
            if (r.chatPosition >= this.pendingReceipt) {
                // ups, keg has a bigger position then we are trying to save
                // console.debug('it is higher then pending one too:', this.pendingReceipt);
                this.pendingReceipt = null;
                return;
            }
            r.chatPosition = this.pendingReceipt;
            // console.debug('Saving receipt: ', pos);
            return r.saveToServer() // eslint-disable-line
            .then(() => {
                if (r.chatPosition >= this.pendingReceipt) {
                    this.pendingReceipt = null;
                }
                if (this.pendingReceipt) {
                    pos = this.pendingReceipt; // eslint-disable-line
                    this.pendingReceipt = null;
                    this.sendReceipt(pos);
                }
            }).catch(err => {
                // normally, this is a connection issue or concurrency.
                // to resolve concurrency error we reload the cached keg
                console.error(err);
                pos = this.pendingReceipt; // eslint-disable-line
                this.pendingReceipt = null;
                this._ownReceipt.load().then(() => {
                    this.sendReceipt(pos);
                });
            });
        });
    }

    // loads own receipt keg, we needs this bcs named keg will not get created until read first time


    // todo: can be faster
    applyReceipts() {
        const users = this.chat.receipts.keys();

        for (let i = 0; i < this.chat.messages.length; i++) {
            const msg = this.chat.messages[i];
            msg.receipts = null;
            for (let k = 0; k < users.length; k++) {
                const username = users[k];
                const receipt = this.chat.receipts.get(username);
                if (+msg.id !== receipt.chatPosition) continue;
                // receiptError is already calculated, signature error MIGHT already have been calculated
                if (receipt.receiptError || receipt.signatureError) continue;
                msg.receipts = msg.receipts || [];
                msg.receipts.push({ username, receipt });
            }
        }
    }

    dispose() {
        this._reactionsToDispose.forEach(d => d());
        tracker.unsubscribe(this.onDigestUpdate);
        this.receipts = {};
    }
}, (_applyDecoratedDescriptor(_class.prototype, 'applyReceipts', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'applyReceipts'), _class.prototype)), _class);


module.exports = ChatReceiptHandler;