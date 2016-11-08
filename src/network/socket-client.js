
/**
 * Peerio network socket client module.
 * This module exports SocketClient class that can be instantiated as many times as needed.
 * Other modules contain singleton instances for general use.
 * @module network/socket-client
 */

const io = require('socket.io-client/socket.io');
const Promise = require('bluebird');
const { ServerError } = require('../errors');

const STATES = {
    open: 'open',
    opening: 'opening',
    closed: 'closed',
    closing: 'closing'
};

const SOCKET_EVENTS = {
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
    pong: 'pong',
    authenticated: 'authenticated'
};

const APP_EVENTS = {
    twoFA: 'twoFA',
    kegsUpdate: 'kegsUpdate'
};

/** Create an instance of Socket per connection. */
class SocketClient {
    socket;
    started = false;
    url = null;

    authenticatedEventListeners = [];
    startedEventListeners = [];
    // following properties are not static for access convenience
    /** Possible connection states */
    STATES = STATES;
    /** System events */
    SOCKET_EVENTS = SOCKET_EVENTS;
    /** Application events */
    APP_EVENTS = APP_EVENTS;

    start(url) {
        if (this.started) return;
        console.log(`Starting socket: ${url}`);
        this.url = url;
        this.started = true;
        this.authenticated = false;

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

        socket.on('connect', () => {
            console.log('\ud83d\udc9a Socket connected.');
            clearBuffers();
        });

        socket.on('disconnect', () => {
            console.log('\ud83d\udc94 Socket disconnected.');
            this.authenticated = false;
            clearBuffers();
        });

        socket.open();
        this.startedEventListeners.forEach(l => setTimeout(l));
        this.startedEventListeners = [];
    }

    /** Returns connection state */
    get state() {
        // unknown states translated to 'closed' for safety
        return STATES[this.socket.io.readyState] || STATES.closed;
    }

    setAuthenticatedState() {
        if (this.state !== STATES.open) return;
        this.authenticated = true;
        this.authenticatedEventListeners.forEach(listener => {
            setTimeout(listener);
        });
    }

    _validateSubscription(event, listener) {
        if (!SOCKET_EVENTS[event] && !APP_EVENTS[event]) {
            throw new Error('Attempt to un/subscribe from/to unknown socket event.');
        }
        if (!listener || typeof (listener) !== 'function') {
            throw new Error('Invalid listener type.');
        }
    }
    /**
     * Subscribes a listener to one of the socket or app events.
     * @param {string} event - event name, one of SOCKET_EVENTS or APP_EVENTS
     * @param {function} listener - event handler
     * @returns {function} - function you can call to unsubscribe
     */
    subscribe(event, listener) {
        this._validateSubscription(event, listener);
        if (event === SOCKET_EVENTS.authenticated) {
            // maybe this listener was subscribed already
            if (this.authenticatedEventListeners.indexOf(listener) < 0) {
                this.authenticatedEventListeners.push(listener);
            }
        } else {
            this.socket.on(event, listener);
        }
        return () => this.unsubscribe(event, listener);
    }

    /** Unsubscribes a listener to socket or app events */
    unsubscribe(event, listener) {
        this._validateSubscription(event, listener);
        if (event === SOCKET_EVENTS.authenticated) {
            const ind = this.authenticatedEventListeners.indexOf(listener);
            if (ind < 0) return;
            this.authenticatedEventListeners.splice(ind, 1);
        } else {
            this.socket.off(event, listener);
        }
    }

    /** Send a message to server */
    send(name, data) {
        return new Promise((resolve, reject) => {
            function handler(resp) {
                if (resp && resp.error) {
                    reject(new ServerError(resp.error, resp.message));
                    return;
                }
                resolve(resp);
            }
            this.socket.emit(name, data, handler);
        });
    }
    /** Executes a callback only once when socket will connect, or immediately if socket is connected already */
    onceConnected(callback) {
        if (this.socket.connected) {
            setTimeout(callback, 0);
            return;
        }
        const handler = () => {
            setTimeout(callback, 0);
            this.unsubscribe(SOCKET_EVENTS.connect, handler);
        };
        this.subscribe(SOCKET_EVENTS.connect, handler);
    }

    /** Executes a callback once socket is started */
    onceStarted(callback) {
        this.startedEventListeners.push(callback);
    }

    /** Closes current connection and disables reconnects. */
    close() {
        this.socket.close();
    }

    open() {
        this.socket.open();
    }
}

module.exports = SocketClient;
