// Just a list of modules pre-required to access from console

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

window.loginTest = () => {
    const user = new window.User();
    const socket = window.socket;
    user.username = 'test9x9x9x';
    user.passphrase = 'such a secret passphrase';
    socket.close();
    socket.onceConnected(() => {
        user.login()
            .then(() => (window.userLogin = user))
            .catch(err => console.error(err));
    });
    socket.open();
};

window.messageTest = () => {
    const user = window.userLogin;
    window.User.current = user;
    const chat = new ChatKegDb(null, [user.username, window.getNextDmUsername()]);
    window.callpromise(chat.load().then(() => {
        return chat.addMessage('hello, how are you');
    }));
};
