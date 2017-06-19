/**
 * DI module to use models and stores avoiding cyclic requires
 * @module helpers/di-file-store
 */
let fileStore;
module.exports = {
    setFileStore(store) {
        fileStore = store;
    },
    /** @returns {FileStore} */
    getFileStore() {
        return fileStore;
    }
};
