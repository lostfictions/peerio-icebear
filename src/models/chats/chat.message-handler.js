/**
 * Module takes care of listening to chat updates and loading updated data
 */
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const config = require('../../config');
const { retryUntilSuccess } = require('../../helpers/retry');
const { reaction } = require('mobx');
const User = require('../user/user');

class ChatMessageHandler {

    maxUpdateId = '';
    downloadedUpdateId = '';
    _loadingUpdates = false; // todo: make this observable in Chat
    _reCheckUpdates = false;

    constructor(chat) {
        this.chat = chat;
        tracker.onKegTypeUpdated(chat.id, 'message', this.onMessageDigestUpdate);
        this.onMessageDigestUpdate();
        reaction(() => this.chat.active, (active) => {
            if (active) {
                this.onMessageDigestUpdate();
            }
        });
        reaction(() => socket.authenticated, (authenticated) => {
            if (authenticated) {
                this.onMessageDigestUpdate();
            }
        });
        reaction(() => User.current.isLooking, (isLooking) => {
            if (isLooking) {
                this.markAllAsSeen();
                console.log('scheduling to remove marker');
                setTimeout(() => {
                    if (!User.current.isLooking) return;
                    this.chat.newMessagesMarkerPos = null;
                    console.log('removed marker');
                }, 7000);
            } else if (!this.chat.newMessagesMarkerPos && this.chat.messages.length) {
                const lastId = this.chat.messages[this.chat.messages.length - 1].id;
                this.chat.newMessagesMarkerPos = lastId;
                console.log('set marker to', lastId);
            }
        });
    }

    onMessageDigestUpdate = () => {
        const msgDigest = tracker.getDigest(this.chat.id, 'message');
        this.chat.unreadCount = msgDigest.newKegsCount;
        this.maxUpdateId = msgDigest.maxUpdateId;
        this.loadUpdates();
    };

    loadUpdates() {
        if (!this.chat.active || this.chat.canGoDown || !this.chat.initialPageLoaded
            || this.downloadedUpdateId >= this.maxUpdateId) return;
        if (this._loadingUpdates) {
            this._reCheckUpdates = true;
            return;
        }
        this._loadingUpdates = true;
        this._reCheckUpdates = false;

        console.log('Getting updates for chat', this.chat.id);
        socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.chat.id,
            options: {
                count: config.chat.maxLoadedMessages,
                type: 'message',
                reverse: false
            },
            filter: {
                minCollectionVersion: this.downloadedUpdateId
            }
        })
            .tapCatch(() => { this._loadingUpdates = false; })
            .then(resp => {
                this._loadingUpdates = false;
                // there's way more updates then we are allowed to load
                // so we jump to most recent messages
                if (resp.hasMore) {
                    this.chat.reset();
                    return;
                }
                this.setDownloadedUpdateId(resp.kegs);
                this.markAllAsSeen();
                console.log(`Got ${resp.kegs.length} updates for chat`, this.chat.id);
                this.chat.addMessages(resp.kegs);
            }).finally(this.onMessageDigestUpdate);
    }

    markAllAsSeen() {
        if (!User.current.isLooking) return;
        tracker.seenThis(this.chat.id, 'message', this.downloadedUpdateId);
    }

    setDownloadedUpdateId(kegs) {
        for (let i = 0; i < kegs.length; i++) {
            if (kegs[i].collectionVersion > this.downloadedUpdateId) {
                this.downloadedUpdateId = kegs[i].collectionVersion;
            }
        }
    }

    getInitialPage() {
        if (this.chat.initialPageLoaded || this.chat.loadingInitialPage) {
            return Promise.resolve();
        }
        this.chat.loadingInitialPage = true;
        console.log('loading initial page for this.chat', this.chat.id);
        return retryUntilSuccess(() => socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.chat.id,
            options: {
                type: 'message',
                reverse: true,
                offset: 0,
                count: config.chat.initialPageSize
            }
        }))
            .then(resp => {
                this.chat.canGoUp = resp.hasMore;
                this.chat.initialPageLoaded = true;
                this.chat.loadingInitialPage = false;
                this.chat._cancelTopPageLoad = false;
                this.chat._cancelBottomPageLoad = false;
                this.setDownloadedUpdateId(resp.kegs);
                if (!this.chat.canGoDown) this.markAllAsSeen();
                console.log(`got initial ${resp.kegs.length} for this.chat`, this.chat.id);
                return this.chat.addMessages(resp.kegs);
            });
    }

    getPage(pagingUp = true) {
        if (!this.chat.initialPageLoaded
            || (pagingUp && this.chat.loadingTopPage)
            || (!pagingUp && this.chat.loadingBottomPage)) {
            return;
        }
        console.debug('Loading page', pagingUp ? 'UP' : 'DOWN');
        if (pagingUp) {
            this.chat.loadingTopPage = true;
            if (this.chat.loadingBottomPage) {
                this.chat._cancelBottomPageLoad = true;
                console.debug('Bottom page load cancelled');
            }
        } else {
            this.chat.loadingBottomPage = true;
            if (this.chat.loadingTopPage) {
                this.chat._cancelTopPageLoad = true;
                console.debug('Top page load cancelled');
            }
        }
        // todo: cancel retries if navigated away from chat?
        retryUntilSuccess(() => socket.send('/auth/kegs/collection/list-ext', {
            collectionId: this.chat.id,
            options: {
                type: 'message',
                reverse: pagingUp,
                fromKegId: this.chat.messages[pagingUp ? 0 : this.chat.messages.length - 1].id,
                count: config.chat.pageSize
            }
        })).then(resp => {
            console.debug('Received page', pagingUp ? 'UP' : 'DOWN',
                pagingUp && this.chat._cancelTopPageLoad
                    || !pagingUp && this.chat._cancelBottomPageLoad ? 'and discarded' : '');
            if (pagingUp) {
                if (this.chat._cancelTopPageLoad) return;
                this.chat.canGoUp = resp.hasMore;
            } else {
                if (this.chat._cancelBottomPageLoad) return;
                this.chat.canGoDown = resp.hasMore;
            }
            if (!pagingUp) {
                this.setDownloadedUpdateId(resp.kegs);
                this.markAllAsSeen();
            }
            return this.chat.addMessages(resp.kegs, pagingUp); // eslint-disable-line consistent-return
            // in case we paged to the most recent or new to us messages
        }).finally(() => {
            if (pagingUp) {
                this.chat.loadingTopPage = false;
                this.chat._cancelTopPageLoad = false;
            } else {
                this.chat.loadingBottomPage = false;
                this.chat._cancelBottomPageLoad = false;
            }
        });
    }


}

module.exports = ChatMessageHandler;
