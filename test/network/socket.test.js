//
// Socket tests
//
const Socket = require('../../src/network/socket').Socket;
const states = require('../../src/network/socket').states;

describe('Socket module', () => {
    it('Should instantiate Socket', () => {
        const s = new Socket('localhost:3000');
        const expected = states.closed;
        const actual = s.getState();
        actual.should.equal(expected);
    });
});
