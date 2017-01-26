/**
 * It's a bit ugly but we need this module because not every module can use User.current
 * because of cyclic references. At the same time we want to keep User.current for ease of access.
 */
let currentUser;
module.exports = {
    setUser(user) {
        currentUser = user;
    },
    /** @returns {User} */
    getUser() {
        return currentUser;
    }
};
