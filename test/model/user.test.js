//
// User module tests
//

const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');
// this is a sequenced test suite
describe('User model', () => {
    const user = new User();
    const userLogin = new User();

    // this user will persist after test run (for debug)
    window.userLogin = userLogin;

    before(function(done) {
        this.timeout(6000);
        user.username = userLogin.username = helpers.getRandomUsername();
        console.log(`Test username: ${user.username}`);
        user.passphrase = userLogin.passphrase = 'such a secret passphrase';
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
        socket.close();
        socket.onceConnected(() => userLogin.login()
                                            .then(() => done())
                                            .catch(err => done(new Error(err)))
                            );
        socket.open();
    });

    it('#04 should set and retrieve a passcode', function() {
        const passcode = 'this is fine';

        this.timeout(6000);
        return user.getPasscodeSecret(passcode)
            .then((passcodeSecret) => {
                return user.getAuthDataFromPasscode(passcode, passcodeSecret);
            })
            .then((authData) => {
                return authData.passphrase.should.equal(user.passphrase);
            })
            .catch((err) => {
                throw err;
            });
    });

    it('#05 cannot use a passcode if account is uninitialized', () => {
        const user2 = new User();

        return user2.getPasscodeSecret('passcode')
            .catch(err => {
                err.message.should.deep.equal('Username is required to derive keys');
            })
            .then(() => {
                user2.username = 'oiuy567890';
                return user2.getPasscodeSecret('passcode');
            })
            .catch(err => {
                err.message.should.deep.equal('Passphrase is required to derive keys');
                return true;
            });
    });
});
