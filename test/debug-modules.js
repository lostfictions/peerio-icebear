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
window.BootKeg = require('../src/models/kegs/boot-keg');
window.SharedKegDb = require('../src/models/kegs/shared-keg-db');
window.SharedBootKeg = require('../src/models/kegs/shared-boot-keg');
window.User = require('../src/models/user');
window.keys = require('../src/crypto/keys');

let counter = 0;
const MAX_COUNT = 19;
function getNextTestDmUser() {
    if (counter > MAX_COUNT) {
        throw new Error('Exceeding pre-registered test users count');
    }
    const user = `testdm${counter}`;
    console.log(user);
    ++counter;
    return user;
}

window.loginTest = () => {
    const user = new window.User();
    const socket = window.socket;
    user.username = 'test9x9x9x';
    user.passphrase = 'such a secret passphrase';
    // socket.reset();
    socket.close();
    socket.onceConnected(() => {
        user.login()
            .then(() => (window.userLogin = user))
            .catch(err => console.error(err));
    });
    socket.open();
};

window.messageTest = (u) => {
    const user = window.userLogin;
    user.createChat(u || getNextTestDmUser())
        .then(() => window.callserver('/auth/kegs/updates/digest'))
        .then(() => window.callserver('/auth/kegs/user/collections'));
};
