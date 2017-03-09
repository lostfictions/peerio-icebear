const { observable, computed, action, reaction, when } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('../kegs/chat-keg-db');
const normalize = require('../../errors').normalize;
const User = require('../user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');
const fileStore = require('../stores/file-store');
const config = require('../../config');

const chatPager = {};

chatPager.getInitialPage = function(chat) {
    if (chat.initialPageLoaded || chat.loadingInitialPage) {
        return Promise.resolve();
    }
    chat.loadingInitialPage = true;
    console.log('loading initial page for chat', chat.id);
    return socket.send('/auth/kegs/collection/list-ext', {
        collectionId: chat.id,
        options: {
            type: 'message',
            reverse: true,
            offset: 0,
            count: config.chat.initialPageSize
        }
    })
        .then(resp => {
            chat.canGoUp = resp.hasMore;
            chat.initialPageLoaded = true;
            chat.loadingInitialPage = false;
            chat._cancelTopPageLoad = false;
            chat._cancelBottomPageLoad = false;
            console.log(`got initial ${resp.kegs.length} for chat`, chat.id);
            chat.addMessages(resp.kegs);
            if (!chat.canGoDown) chat.updater.markAllAsSeen();
        });
};

chatPager.getPage = function(chat, pagingUp = true) {
    if (!chat.initialPageLoaded || (pagingUp && chat.loadingTopPage) || (!pagingUp && chat.loadingBottomPage)) {
        return Promise.resolve();
    }
    console.debug('Loading page', pagingUp ? 'UP' : 'DOWN');
    if (pagingUp) {
        chat.loadingTopPage = true;
        if (chat.loadingBottomPage) {
            chat._cancelBottomPageLoad = true;
            console.debug('Bottom page load cancelled');
        }
    } else {
        chat.loadingBottomPage = true;
        if (chat.loadingTopPage) {
            chat._cancelTopPageLoad = true;
            console.debug('Top page load cancelled');
        }
    }
    return socket.send('/auth/kegs/collection/list-ext', {
        collectionId: chat.id,
        options: {
            type: 'message',
            reverse: pagingUp,
            fromKegId: chat.messages[pagingUp ? 0 : chat.messages.length - 1].id,
            count: config.chat.pageSize
        }
    })
        .then(resp => {
            console.debug('Received page', pagingUp ? 'UP' : 'DOWN',
            pagingUp && chat._cancelTopPageLoad || !pagingUp && chat._cancelBottomPageLoad ? 'and discarded' : '');
            if (pagingUp) {
                chat.loadingTopPage = false;
                if (chat._cancelTopPageLoad) return;
                chat.canGoUp = resp.hasMore;
            } else {
                chat.loadingBottomPage = false;
                if (chat._cancelBottomPageLoad) return;
                chat.canGoDown = resp.hasMore;
            }
            chat.addMessages(resp.kegs, pagingUp);
            if (!chat.canGoDown) chat.updater.markAllAsSeen();
        })
        .finally(() => {
            if (pagingUp) chat._cancelTopPageLoad = false;
            else chat._cancelBottomPageLoad = false;
        });
};


module.exports = chatPager;