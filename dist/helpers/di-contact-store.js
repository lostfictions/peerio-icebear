"use strict";

/**
 * DI module to use models and stores avoiding cyclic requires
 * @module helpers/di-contact-store
 * @protected
 */
let contactStore;
module.exports = {
  /**
   * This is used by ContactStore module only
   * @protected
   */
  setContactStore(store) {
    contactStore = store;
  },
  /**
   * Use this from icebear when u want to avoid cyclic require
   * @returns {ContactStore} contact store instance
   * @protected
   */
  getContactStore() {
    return contactStore;
  }
};