/**
 * DI module to use models/user avoiding cyclic requires
 */
let contactStore;
module.exports = {
    setContactStore(store) {
        contactStore = store;
    },
    /** @returns {User} */
    getContactStore() {
        return contactStore;
    }
};
