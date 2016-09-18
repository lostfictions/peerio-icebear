//
// Socket tests
//
const Socket = require('../../src/network/socket').Socket;
const states = require('../../src/network/socket').states;

describe('Socket module', () => {
    it('Should instantiate Socket', () => {
        const url = 'localhost:3000';
        const s = new Socket(url);
        const expectedState = states.closed;
        const actualState = s.state;
        actualState.should.equal(expectedState);
        s.url.should.equal(url);
    });
});
