//
// Test helpers
//
const clearRequire = require('clear-require');
const mockSocket = require('./mocks/socket.mock');

const usernameChars = '0123456789abcdefghijklmnopqrstuvwxyz';
// generates 16-character random usernames
function getRandomUsername() {
    let username = '';
    for (let i = 0; i < 30; i++) {
        username += usernameChars[Math.floor(Math.random() * usernameChars.length)];
    }
    return username;
}

function resetApp() {
    for (const key in Object.keys(require.cache)) {
        if (require.cache[key].exports.dispose) require.cache[key].exports.dispose();
    }
    clearRequire.match(/'\/src\/'/);
    mockSocket();
    require('./init-icebear'); // eslint-disable-line
}


module.exports = { getRandomUsername, resetApp };
