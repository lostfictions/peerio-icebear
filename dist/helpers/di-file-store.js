"use strict";

/**
 * DI module to use models and stores avoiding cyclic requires
 * @module helpers/di-file-store
 * @protected
 */
let fileStore;
module.exports = {
  /**
   * Only FileStore needs this
   * @protected
   */
  setFileStore(store) {
    fileStore = store;
  },
  /**
   * Use this to avoid cyclic requires
   * @returns {FileStore}
   */
  getFileStore() {
    return fileStore;
  }
};