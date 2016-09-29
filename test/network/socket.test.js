//
// Socket tests
//
const SocketClient = require('../../src/network/socket-client');

describe('SocketClient module', () => {
    it('Should instantiate SocketClient', () => {
        const s = new SocketClient('localhost:3000');
        const expectedState = SocketClient.states.closed;
        const actualState = s.state;
        actualState.should.equal(expectedState);
    });

    it('Should validate subscriptions', () => {
        const s = new SocketClient('localhost:3000');
        const listener = () => {};
        s.subscribe(SocketClient.events.connect, listener);
        s.unsubscribe(SocketClient.events.connect, listener);
        // subscribe empty listener
        (() => s.subscribe(SocketClient.events.connect)).should.throw(Error);
        // unsubscribe empty listener
        (() => s.unsubscribe(SocketClient.events.connect)).should.throw(Error);
        // subscribe invalid listener
        (() => s.subscribe(SocketClient.events.connect, 5)).should.throw(Error);
        // unsubscribe invalid listener
        (() => s.unsubscribe(SocketClient.events.connect, 'wergwqer')).should.throw(Error);
        // subscibe to invalid event
        (() => s.subscribe('fasdferg2', listener)).should.throw(Error);
        // unsubscibe from invalid event
        (() => s.unsubscribe('fasdferg2', listener)).should.throw(Error);
    });
});
