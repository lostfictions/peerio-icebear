//
// User module tests
//

const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');

describe('User model', () => {
    before((done) => {
        socket.onceConnected(done);
    });

    it('should register new user', () => {
        const u = new User(helpers.getRandomUsername());
        u.passphrase = 'such a secret passphrase';
        return u.createAccount();
    });

    it('should server-validate username',
        () => User.validateUsername('fkwuvnsptu33ti').then(available => available.should.be.true));
});
