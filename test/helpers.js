//
// Test helpers
//
const mockSocket = require('./mocks/socket.mock');
const mockCurrentUser = require('./mocks/user.mock');
const mockPhraseDictionary = require('./mocks/phraseDictionary.mock');

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
    for (const key of Object.keys(require.cache)) {
        if (require.cache[key].exports && require.cache[key].exports.dispose) require.cache[key].exports.dispose();
    }
    const srcDir = `${process.cwd()}/src`;

    Object.keys(require.cache).forEach(module => {
        if (module.startsWith(srcDir)) {
            delete require.cache[module];
        }
    });

    require('./test-config')();
    mockSocket();
    require('../src/').socket.start();
    mockCurrentUser();
    mockPhraseDictionary();
}


module.exports = { getRandomUsername, resetApp };
