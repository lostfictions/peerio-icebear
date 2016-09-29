//
// Registration request model tests
//

const RegistrationRequest = require('../../src/models/registration-request');
// const Promise = require('bluebird');
const socket = require('../../src/network/socket');

describe('Registration request model', () => {
    before(done => {
        socket.onceConnected(done);
    });

    it('should server-validate username', () => {
        const r = new RegistrationRequest();
        r.username = 'fkwuvnsptu33ti';
        return r.validateUsername().then(available => available.should.be.true);
    });
});
