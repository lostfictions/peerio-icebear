const { action, reaction } = require('mobx');
const User = require('../user/user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');

class ChatReceiptHandler {
    // receipts cache {username: position}
    receipts = {};
    downloadedReceiptId = 0;
    loadingReceipts = false;
    scheduleReceiptsLoad = false;
    // this value means that something is scheduled to send
    pendingReceipt = null;

    constructor(chat) {
        this.chat = chat;
        tracker.onKegTypeUpdated(chat.id, 'receipt', this.onReceiptDigestUpdate);
        this.onReceiptDigestUpdate();
        reaction(() => socket.authenticated, authenticated => {
            if (!authenticated || !this.pendingReceipt) return;
            const pos = this.pendingReceipt;
            this.pendingReceipt = null;
            this.sendReceipt(pos);
        });
    }

    onReceiptDigestUpdate = _.throttle(() => {
        this.loadReceipts();
    }, 1000);


    sendReceipt(pos) {
        console.debug(`sendReceipt(${pos})`);
        if (typeof pos !== 'number') throw new Error(`Attempt to send invalid receipt position ${pos}`);
        // console.debug('asked to send receipt: ', pos);
        // if something is currently in progress of sending we just want to adjust max value
        if (this.pendingReceipt) {
            console.debug('Pending receipt exists ', this.pendingReceipt);
            // we don't want to send older receipt if newer one exists already
            this.pendingReceipt = Math.max(pos, this.pendingReceipt);
            // console.debug('receipt was pending. now pending: ', this.pendingReceipt);
            return; // will be send after current receipt finishes sending
        }
        this.pendingReceipt = pos;
        // getting it from cache or from server
        this.loadOwnReceipt()
            .then(r => {
                console.debug('Loaded own receipt pos: ', r.position, ' pending: ', this.pendingReceipt);
                if (r.position >= this.pendingReceipt) {
                    // ups, keg has a bigger position then we are trying to save
                    // console.debug('it is higher then pending one too:', this.pendingReceipt);
                    this.pendingReceipt = null;
                    return;
                }
                r.position = this.pendingReceipt;
                // console.debug('Saving receipt: ', pos);
                return r.saveToServer() // eslint-disable-line
                    .then(() => {
                        if (r.position >= this.pendingReceipt) {
                            this.pendingReceipt = null;
                        }
                    })
                    .catch(err => {
                        // normally, this is a connection issue or concurrency.
                        // to resolve concurrency error we reload the cached keg
                        console.error(err);
                        this._ownReceipt = null;
                    })
                    .finally(() => {
                        if (socket.authenticated && this.pendingReceipt && r.position < this.pendingReceipt) {
                            pos = this.pendingReceipt;// eslint-disable-line
                            this.pendingReceipt = null;
                            this.sendReceipt(pos);
                        }
                    });
            });
    }

    // loads or creates new receipt keg
    loadOwnReceipt() {
        if (this._ownReceipt) return Promise.resolve(this._ownReceipt);
        return socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.chat.id,
            filter: {
                minCollectionVersion: '',
                username: User.current.username,
                deleted: false

            },
            options: {
                type: 'receipt'
            }
        }).then(res => {
            const r = new Receipt(this.chat.db);
            if (res && res.kegs && res.kegs.length) {
                r.loadFromKeg(res.kegs[0]);
                // if for some reason, duplicate kegs were created, remove them
                for (let i = 1; i < res.kegs.length; i++) {
                    const toRemove = new Receipt(this.chat.db);
                    toRemove.id = res.kegs[i].kegId;
                    console.debug(`Deleting receipt keg ${toRemove.id}`);
                    toRemove.remove();
                }
                this._ownReceipt = r;
                return r;
            }
            console.debug(`Creating receipt keg`);
            r.username = User.current.username;
            r.position = 0;
            this._ownReceipt = r;
            return r.saveToServer().return(r);
        });
    }

    loadReceipts() {
        if (this.loadingReceipts) {
            this.scheduleReceiptsLoad = true;
            return;
        }
        this.loadingReceipts = true;
        this.scheduleReceiptsLoad = false;
        socket.send('/auth/kegs/query', {
            collectionId: this.chat.id,
            minCollectionVersion: this.downloadedReceiptId || '',
            query: { type: 'receipt' }
        }).then(res => {
            if (!res && !res.length) return;
            for (let i = 0; i < res.length; i++) {
                if (res[i].collectionVersion > this.downloadedReceiptId) {
                    this.downloadedReceiptId = res[i].collectionVersion;
                }
                try {
                    const r = new Receipt(this.chat.db);
                    r.loadFromKeg(res[i]);
                    // todo: warn about error?
                    if (r.receiptError || r.signatureError || !r.username
                        || r.username === User.current.username || !r.position) continue;
                    this.receipts[r.username] = r.position;
                } catch (err) {
                    // we don't want to break everything for one faulty receipt
                    // also we don't want to log this, because in case of faulty receipt there will be
                    // too many logs
                    // console.debug(err);
                }
            }
            this.applyReceipts();
        }).finally(() => {
            this.loadingReceipts = false;
            // if there were updates while we were loading receipts - this call will catch up with them
            if (this.scheduleReceiptsLoad && socket.authenticated) {
                this.loadReceipts();
            }
        });
    }

    // todo: can be faster
    @action applyReceipts() {
        const users = Object.keys(this.receipts);
        for (let i = 0; i < this.chat.messages.length; i++) {
            const msg = this.chat.messages[i];
            msg.receipts = null;
            for (let k = 0; k < users.length; k++) {
                const username = users[k];
                if (+msg.id !== this.receipts[username]) continue;
                msg.receipts = msg.receipts || [];
                msg.receipts.push(username);
            }
        }
    }


}

module.exports = ChatReceiptHandler;
