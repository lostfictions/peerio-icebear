/**
 * Makes it look like there's an authenticated user in current session
 */

function mockCurrentUser() {
    const User = require('../../src/models/user/user');
    const user = new User();
    user.username = 'currenttestuser';
    User.current = user;
}

module.exports = mockCurrentUser;
