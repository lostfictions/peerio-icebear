// Just a list of modules pre-required to access from console
const helpers = require('./helpers');

const m = window.modules = {};
window.log = (res) => { window.lastResult = res; console.log(res); };
window.errlog = (res) => { window.lastError = res; console.error(res); };
window.callpromise = (promise) => promise.then(window.log).catch(window.errlog);

m.socket = require('../src/network/socket');

window.socket = window.modules.socket;
window.callserver = (action, params) => window.callpromise(window.socket.send(action, params));

window.Keg = require('../src/models/kegs/keg');
window.KegDb = require('../src/models/kegs/keg-db');
window.KegDbStore = require('../src/models/kegs/keg-db-store');
window.BootKeg = require('../src/models/kegs/boot-keg');
const ChatKegDb = window.ChatKegDb = require('../src/models/kegs/chat-keg-db');
window.User = require('../src/models/user');
window.keys = require('../src/crypto/keys');

const MAX_UCOUNTER = 19;
let uc = 0;

window.getNextDmUsername = () => {
    if (uc > MAX_UCOUNTER) {
        throw new Error(`Max ${MAX_UCOUNTER} pre-registered users`);
    }
    uc++;
    return `testdm${uc}`;
};

const passphrase = 'such a secret passphrase';
window.loginTest = () => {
    const user = new window.User();
    const socket = window.socket;
    user.username = 'testdm0';
    user.passphrase = passphrase;
    socket.onceConnected(() => {
        user.login()
            .then(() => (window.userLogin = user))
            .catch(err => console.error(err));
    });
};

let chat = null;
const userTo = 'testdm0' || window.getNextDmUsername();

window.signupRandom = () => {
    const user = new window.User();
    const socket = window.socket;
    user.username = helpers.getRandomUsername();
    user.passphrase = passphrase;
    user.email = `${user.username}@mailinator.com`;
    socket.onceConnected(() => {
        user.createAccountAndLogin()
            .then(() => (window.userLogin = user))
            .catch(err => console.error(err));
    });
};

window.messageTest = () => {
    const user = window.userLogin;
    window.User.current = user;
    let p = Promise.resolve(true);
    if (!chat) {
        chat = new ChatKegDb(null, [user.username, userTo]);
        p = chat.load();
    }
    window.callpromise(p.then(() => {
        return chat.addMessage('hello, how are you');
    }));
};
