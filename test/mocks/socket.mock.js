/**
 * Working with socket mock:
 * 1. call mockSocket() once, before any other require('./src/network/socket')
 * 2. set socket.__responseMocks at any time, but before sending something to socket
 *    Format:
 *    {
 *      messageName1: [handler11, handler12],
 *      messageName2: [handler21, handler22, handler23]
 *    }
 *  3. When application code calls socket.send(name, data):
 *      - mock shifts the next handler from handlers array (FIFO)
 *      - mock asynchronously runs the handler, passing 'data'
 *      - mock takes synchronous return value from handler and generates normal response event
 *      - mock will throw if there are no handlers for message
 *  4. call socket.__reset() at any time u need to reset mocked responses, listeners and other socket state
 */
function mockSocket() {
    const socket = require('../../src/network/socket'); // eslint-disable-line
    if (socket.__mocked) throw new Error('Tests error: Socket already mocked.');
    socket.__mocked = true;
    socket.__mockListeners = [];
    socket.__responseMocks = {};
    socket.__reset = function() {
        socket.__mockListeners = [];
        socket.__responseMocks = {};
    };
    socket.start = function() {
        this.socket = {
            // engine.io object mock
            io: {
                readyState: 'open'
            },
            // fake subscribe to real socket events
            on(event, listener) {
                socket.__mockListeners.push({ event, listener });
            },
            // fake unsubscribe from real socket events
            off(event, listener) {
                socket.__mockListeners = socket.__mockListeners
                    .filter(item => item.event !== event || item.listener !== listener);
            },
            // fake send messages to socket
            emit(name, data, handler) {
                if (!socket.__responseMocks || !socket.__responseMocks[name]
                    || !socket.__responseMocks[name].length) {
                    throw new Error('Test Mock error: missing socket response mocks.');
                }

                const mockHandler = socket.__responseMocks[name].shift();
                setTimeout(() => handler(mockHandler(data)));
            },
            // fake open socket
            open() {
                this.socket.io.readyState = 'open';
            },
            // fake close socket
            close() {
                this.socket.io.readyState = 'closed';
            }

        };
        this.started = true;
        this.connected = true;
        this.preauthenticated = false;
        this.authenticated = false;
    };
    return socket;
}

module.exports = mockSocket;
