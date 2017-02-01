/**
 * DI module to use models/user avoiding cyclic requires
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
