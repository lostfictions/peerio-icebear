// @flow
/**
 * Peerio network socket module.
 * @module socket
 */

const io = require('socket.io-client');

const states = {
    open: 'open',
    opening: 'opening',
    closed: 'closed',
    closing: 'closing',
    authenticated: 'authenticated'
};

const socketEvents = {
    connect: 'connect',
    connect_error: 'connect_error',
    connect_timeout: 'connect_timeout',
    connecting: 'connecting',
    disconnect: 'disconnect',
    error: 'error',
    reconnect: 'reconnect',
    reconnect_attempt: 'reconnect_attempt',
    reconnect_failed: 'reconnect_failed',
    reconnect_error: 'reconnect_error',
    reconnecting: 'reconnecting',
    ping: 'ping',
    pong: 'pong'
};

const appEvents = {
    twoFA: 'twoFA'
};

/** Create an instance of Socket per connnection. */
class Socket {
    socket: Object;
    authenticated: bool;

    /** Possible connection states */
    static states = states;
    /** System events */
    static socketEvents = socketEvents;
    /** Application events */
    static appEvents = appEvents;

    constructor(url: string) {
        const socket = this.socket = io.connect(url, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            randomizationFactor: 0.3,
            timeout: 10000,
            autoConnect: false,
            transports: ['websocket'],
            forceNew: true
        });

        // socket.io is weird, it caches data sometimes to send it to listeners after reconnect
        // but this is not working with authenticate-first connections.
        const clearBuffers = () => {
            socket.sendBuffer = [];
            socket.receiveBuffer = [];
        };

        const login = () => {
            // TODO: implement auth
            this.authenticated = true;
        };

        const logout = () => {
            this.authenticated = false;
        };

        socket.on('connect', () => {
            clearBuffers();
            login();
        });

        socket.on('disconnect', () => {
            clearBuffers();
            logout();
        });
    }

    /** Returns connection state */
    get state(): string {
        if (this.socket.readyState === states.open && this.authenticated) {
            return states.authenticated;
        }
        // unknown states translated to 'closed' for safety
        return states[this.socket.readyState] || states.closed;
    }

    /** Starts a connecton with auto-reconnects */
    open() {
        this.socket.open();
    }

    validateSubscription(event: string, listener: Function) {
        if (!socketEvents[event] && !appEvents[event]) {
            throw new Error('Attempt to un/subscribe from/to unknown socket event.');
        }
        if (!listener || typeof (listener) !== 'function') {
            throw new Error('Invalid listener type.');
        }
    }

    subscribe(event: string, listener: Function) {
        this.validateSubscription(event, listener);
        this.socket.on(event, listener);
    }

    unsubscribe(event: string, listener: Function) {
        this.validateSubscription(event, listener);
        this.socket.off(event, listener);
    }

    /** Closes current connection and disables reconnects. */
    close() {
        this.socket.close();
    }
}

exports.Socket = Socket;
