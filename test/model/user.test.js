//
// User module tests
//

const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');
// this is a sequenced test suite
describe('User model', () => {
    const user = new User();

    before((done) => {
        user.username = helpers.getRandomUsername();
        socket.onceConnected(done);
    });

    it('#01 should server-validate username',
        () => User.validateUsername(user.username).then(available => available.should.be.true));

    it('#02 should register new user', () => {
        user.passphrase = 'such a secret passphrase';
        return user.createAccount();
    });

    it('#03 should get correct authSalt', () => {
        const expected = user.authSalt;
        user.authSalt = null;
        return user._loadAuthSalt().then(() => {
            user.authSalt.should.eql(expected);
        });
    });

    it('#04 should load auth token', () => {
        user._getAuthToken().then((response) => {
            response.ephemeralServerPK.length.should.equal(32);
            response.nonce.length.should.equal(24);
            response.token.length.should.equal(48);
        });
    });

    it('#05 should login', () => user.login());
});
