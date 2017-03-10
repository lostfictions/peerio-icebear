const { observable, computed, action, reaction, when } = require('mobx');
const User = require('../user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');

class ChatReceiptHandler {
    // receipts cache {username: position}
    _receipts = {};
    downloadedReceiptId = 0;

    constructor(chat) {
        this.chat = chat;
        tracker.onKegTypeUpdated(chat.id, 'receipt', this.onReceiptDigestUpdate);
        this.onReceiptDigestUpdate();
    }

    onReceiptDigestUpdate = _.throttle(() => {
        this.loadReceipts();
    }, 2000);


    // this flag means that something is currently being sent (in not null)
    // it might equal the actual receipt value being sent,
    // or a larger number that will be sent right after current one
    pendingReceipt = null;

    sendReceipt(pos) {
        // console.debug('asked to send receipt: ', pos);
        // if something is currently in progress of sending we just want to adjust max value
        if (this.pendingReceipt) {
            this.pendingReceipt = Math.max(pos, this.pendingReceipt);
            // console.debug('receipt was pending. now pending: ', this.pendingReceipt);
            return; // will be send after current receipt finishes sending
        }
        // we don't want to send older receipt if newer one exists already
        // this shouldn't really happen, but it's safer this way
        pos = Math.max(pos, this.pendingReceipt); // eslint-disable-line no-param-reassign
        this.pendingReceipt = pos;
        // getting it from cache or from server
        this.loadOwnReceipt()
            .then(r => {
                if (r.position >= pos) {
                    // console.debug('receipt keg loaded but it has a higher position: ', pos, r.position);
                    // ups, keg has a bigger position then we are trying to save
                    // is our pending position also smaller?
                    if (r.position >= this.pendingReceipt) {
                        // console.debug('it is higher then pending one too:', this.pendingReceipt);
                        this.pendingReceipt = null;
                        return;
                    }
                    // console.debug('scheduling to save pending receipt instead: ', this.pendingReceipt);
                    const lastPending = this.pendingReceipt;
                    this.pendingReceipt = null;
                    this.sendReceipt(lastPending);
                }
                r.position = pos;
                // console.debug('Saving receipt: ', pos);
                return r.saveToServer() // eslint-disable-line
                    .catch(err => {
                        // normally, this is a connection issue or concurrency.
                        // to resolve concurrency error we reload the cached keg
                        console.error(err);
                        this.ownReceipt = null;
                    })
                    .finally(() => {
                        const lastPending = this.pendingReceipt;
                        this.pendingReceipt = null;
                        if (r.position < lastPending) {
                            // console.debug('scheduling to save pending receipt instead: ', lastPending);
                            this.sendReceipt(lastPending);
                        }
                    });
            });
    }

    // loads or creates new receipt keg
    loadOwnReceipt() {
        if (this._ownReceipt) return Promise.resolve(this._ownReceipt);

        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: 0,
            query: { type: 'receipt', username: User.current.username }
        }).then(res => {
            const r = new Receipt(this.db);
            if (res && res.length) {
                r.loadFromKeg(res[0]);
                return r;
            }
            r.username = User.current.username;
            r.position = 0;
            this._ownReceipt = r;
            return r.saveToServer().return(r);
        });
    }

    loadReceipts() {
        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: this.downloadedReceiptId || 0,
            query: { type: 'receipt' }
        }).then(res => {
            if (!res && !res.length) return;
            for (let i = 0; i < res.length; i++) {
                this.downloadedReceiptId = Math.max(this.downloadedReceiptId, res[i].collectionVersion);
                try {
                    const r = new Receipt(this.db);
                    r.loadFromKeg(res[i]);
                    // todo: warn about signature error?
                    if (r.receiptError || r.signatureError || !r.username
                        || r.username === User.current.username || !r.position) continue;
                    this._receipts[r.username] = r.position;
                } catch (err) {
                    // we don't want to break everything for one faulty receipt
                    // also we don't want to log this, because in case of faulty receipt there will be
                    // too many logs
                    // console.debug(err);
                }
            }
            this._applyReceipts();
        });
    }

    @action applyReceipts() {
        const users = Object.keys(this._receipts);
        for (let i = 0; i < this.messages.length; i++) {
            const msg = this.messages[i];
            msg.receipts = null;
            for (let k = 0; k < users.length; k++) {
                const username = users[k];
                if (+msg.id !== this._receipts[username]) continue;
                msg.receipts = msg.receipts || [];
                msg.receipts.push(username);
            }
        }
    }


}

module.exports = ChatReceiptHandler;
