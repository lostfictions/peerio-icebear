/**
 * DI module to use models/user avoiding cyclic requires
 * @module helpers/di-current-user
 * @protected
 */
let currentUser;
module.exports = {
    /**
     * Only User module uses this
     * @protected
     */
    setUser(user) {
        currentUser = user;
    },
    /**
     * Use this to avoid cyclic requires
     * @returns {User}
     */
    getUser() {
        return currentUser;
    }
};
