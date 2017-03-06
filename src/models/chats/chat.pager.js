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
    if (chat.initialPageLoaded || this.loadingPage) return Promise.resolve();
    chat.loadingPage = true;
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
            chat.initialPageLoaded = true;
            chat.loadingPage = false;
            console.log(`got initial ${resp.kegs.length} for chat`, chat.id);
            return chat.addMessages(resp.kegs);
        });
};

function getPage(chat, pagingUp = true) {
    if (!chat.initialPageLoaded || this.loadingPage) return Promise.resolve();
    chat.loadingPage = true;
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
            chat.loadingPage = false;
            return chat.addMessages(resp.kegs, pagingUp);
        });
}

chatPager.loadPreviousPage = function(chat) {
    return getPage(chat, true);
};
chatPager.loadNextPage = function(chat) {
    return getPage(chat, false);
};

module.exports = chatPager;
