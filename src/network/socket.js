// @flow
/**
 * Peerio network socket module.
 * @module socket
 */

const io = require('socket.io-client');

const states = { open: 'open', opening: 'opening', closed: 'closed', closing: 'closing', unknown: 'unknown' };

/**
 * Create an instance of Socket per connnection.
 */
class Socket {
    constructor(url: string): undefined {
        this.url = url;
        this.socket = null;
    }
/**
 * Returns connection state
 */
    getState(): string {
        if (!this.socket) return states.closed;
        return states[this.socket.readyState] || states.unknown;
    }

/**
 * Starts a connecton with auto-reconnects
 */
    open(): undefined {
        if (this.socket) {
            this.socket.open();
            return;
        }

        this.socket = io.connect(this.url, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            randomizationFactor: 0.3,
            timeout: 10000,
            autoConnect: true,
            transports: ['websocket'],
            forceNew: true
        });
    }

/**
 * Closes current connection and disables reconnects.
 */
    close(): undefined {
        this.socket.close();
    }
}

exports.Socket = Socket;

exports.states = states;