"use strict";

/**
 * DI module to use models and stores avoiding cyclic requires
 * @module helpers/di-chat-store
 * @protected
 */
let chatStore;
module.exports = {
  /**
   * This is used by ChatStore module only
   * @protected
   */
  setChatStore(store) {
    chatStore = store;
  },
  /**
   * Use this from icebear when u want to avoid cyclic require
   * @returns {ChatStore} chat store instance
   * @protected
   */
  getChatStore() {
    return chatStore;
  }
};