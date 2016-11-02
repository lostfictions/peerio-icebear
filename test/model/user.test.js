//
// User module tests
//

const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');
// this is a sequenced test suite
describe('User model', () => {
    // instances of User *for the same account*
    const user = new User();
    const userInst2 = new User();
    const userInst3 = new User();
    const userInst4 = new User();
    const passphrase = 'such a secret passphrase';

    // this user will persist after test run (for debug)
    window.userLogin = userInst2;

    before(function(done) {
        this.timeout(6000);
        user.username = userInst2.username = userInst3.username = userInst4.username = helpers.getRandomUsername();
        console.log(`Test username: ${user.username}`);
        user.passphrase = userInst2.passphrase = passphrase;
        user.email = `${user.username}@mailinator.com`;
        socket.onceConnected(done);
    });

    it('#01 should server-validate username',
        () => User.validateUsername(user.username).then(available => available.should.be.true));

    it('#02 should register new user', function() {
        this.timeout(6000);
        return user.createAccountAndLogin();
    });

    it('#03 should login', function(done) {
        this.timeout(6000);
        user.stopReauthenticator();
        socket.close();
        socket.onceConnected(() => userInst2.login()
                                            .then(() => done())
                                            .catch(err => done(new Error(err)))
                            );
        socket.open();
    });

    it('#04 can log in with passcode', function(done) {
        const passcode = 'passcode bla';

        this.timeout(6000);
        userInst2.stopReauthenticator();
        user.setPasscode(passcode)
            .then(() => {
                socket.close();
                userInst3.passphrase = passcode;
                socket.onceConnected(() => userInst3.login()
                    .then(() => done())
                    .catch(err => done(new Error(err)))
                );
                socket.open();
            })
            .catch(err => {
                done(err);
            });
    });

    it('#05 can log in with passphrase even when passcode is set', function(done) {
        this.timeout(6000);
        userInst3.stopReauthenticator();
        socket.close();
        userInst4.passphrase = passphrase;
        socket.onceConnected(() => userInst4.login()
            .then(() => done())
            .catch(err => done(new Error(err)))
        );
        socket.open();
    });
});
