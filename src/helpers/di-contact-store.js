/**
 * DI module to use models and stores avoiding cyclic requires
 */
let contactStore;
module.exports = {
    setContactStore(store) {
        contactStore = store;
    },
    /** @returns {ContactStore} */
    getContactStore() {
        return contactStore;
    }
};
