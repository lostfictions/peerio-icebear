//
// Socket tests
//
const Socket = require('../../src/network/socket').Socket;

describe('Socket module', () => {
    it('Should instantiate Socket', () => {
        const s = new Socket('localhost:3000');
        const expectedState = Socket.states.closed;
        const actualState = s.state;
        actualState.should.equal(expectedState);
    });

    it('Should validate subscriptions', () => {
        const s = new Socket('localhost:3000');
        const listener = () => {};
        s.subscribe(Socket.socketEvents.connect, listener);
        s.unsubscribe(Socket.socketEvents.connect, listener);
        // subscribe empty listener
        (() => s.subscribe(Socket.socketEvents.connect)).should.throw(Error);
        // unsubscribe empty listener
        (() => s.unsubscribe(Socket.socketEvents.connect)).should.throw(Error);
        // subscribe invalid listener
        (() => s.subscribe(Socket.socketEvents.connect, 5)).should.throw(Error);
        // unsubscribe invalid listener
        (() => s.unsubscribe(Socket.socketEvents.connect, 'wergwqer')).should.throw(Error);
        // subscibe to invalid event
        (() => s.subscribe('fasdferg2', listener)).should.throw(Error);
        // unsubscibe from invalid event
        (() => s.unsubscribe('fasdferg2', listener)).should.throw(Error);
    });
});
