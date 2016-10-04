//
// Test helpers
//
const usernameChars = '_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// generates 16-character random usernames
module.exports.getRandomUsername = function() {
    let username = '';
    for (let i = 0; i < 16; i++) {
        username += usernameChars[Math.floor(Math.random() * usernameChars.length)];
    }
    return username;
};
