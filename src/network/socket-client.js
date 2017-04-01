
/**
 * Peerio network socket client module.
 * This module exports SocketClient class that can be instantiated as many times as needed.
 * Other modules contain singleton instances for general use.
 * @module network/socket-client
 */

const io = require('socket.io-client/dist/socket.io');
const { ServerError, DisconnectedError } = require('../errors');
const { observable } = require('mobx');
const config = require('../config');
const util = require('../util');

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
    kegsUpdate: 'kegsUpdate',
    serverWarning: 'serverWarning',
    clearWaring: 'clearWarning'
};

/** Create an instance of Socket per connection. */
class SocketClient {
    socket = null;
    started = false;
    url = null;
    @observable connected = false;
    @observable authenticated = false;
    @observable throttled = false;
    // for debug (if enabled)
    // DON'T MAKE THIS OBSERVABLE
    // At some conditions it creates cyclic reactions with autorun
    bytesReceived = 0;
    bytesSent = 0;

    requestId = 0;
    awaitingRequests = {}; // {number: function}

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
        const self = this;
        this.url = url;
        this.started = true;
        this.authenticated = false;
        // <DEBUG>
        if (config.debug && config.debug.trafficReportInterval > 0) {
            const s = WebSocket.prototype.send;
            WebSocket.prototype.send = function(msg) {
                self.bytesSent += msg.length || msg.byteLength || 0;
                if (config.debug.socketLogEnabled && typeof msg === 'string') {
                    console.log('OUTGOING SOCKET MSG:', msg);
                }
                return s.call(this, msg);
            };
            setInterval(() => {
                console.log('SENT:', util.formatBytes(self.bytesSent),
                    'RECEIVED:', util.formatBytes(self.bytesReceived));
            }, config.debug.trafficReportInterval);
        }
        // </DEBUG>

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
            this.configureDebugLogger();
            this.connected = true;
        });

        socket.on('disconnect', () => {
            console.log('\ud83d\udc94 Socket disconnected.');
            this.authenticated = false;
            this.connected = false;
            clearBuffers();
            this.cancelAwaitingRequests();
        });

        socket.open();

        this.startedEventListeners.forEach(l => setTimeout(l));
        this.startedEventListeners = [];
    }

    configureDebugLogger() {
        if (config.debug && config.debug.trafficReportInterval > 0) {
            this.socket.io.engine.addEventListener('message', (msg) => {
                this.bytesReceived += msg.length || msg.byteLength || 0;
                if (config.debug.socketLogEnabled && typeof msg === 'string') {
                    console.log('INCOMING SOCKET MSG:', msg);
                }
            });
        }
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
        const id = this.requestId++;
        return new Promise((resolve, reject) => {
            this.awaitingRequests[id] = reject;
            function handler(resp) {
                if (resp && resp.error) {
                    this.throttled = this.throttled || (resp.error === 425);
                    reject(new ServerError(resp.error, resp.message));
                    return;
                }
                resolve(resp);
            }
            this.socket.emit(name, data, handler);
        })
            .timeout(60000)
            .finally(() => {
                delete this.awaitingRequests[id];
            });
    }

    cancelAwaitingRequests() {
        const err = new DisconnectedError();
        for (const id in this.awaitingRequests) {
            this.awaitingRequests[id](err);
        }
        this.awaitingRequests = {};
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

    onceAuthenticated(callback) {
        if (this.authenticated) {
            setTimeout(callback, 0);
            return;
        }
        const handler = () => {
            setTimeout(callback, 0);
            this.unsubscribe(SOCKET_EVENTS.authenticated, handler);
        };
        this.subscribe(SOCKET_EVENTS.authenticated, handler);
    }

    /** Executes a callback once socket is started */
    onceStarted(callback) {
        this.startedEventListeners.push(callback);
    }

    /** Shortcut to frequently used 'authenticated' subscription */
    onAuthenticated(handler) {
        this.subscribe(SOCKET_EVENTS.authenticated, handler);
    }

    /** Shortcut to frequently used 'disconnect' subscription */
    onDisconnect(handler) {
        this.subscribe(SOCKET_EVENTS.disconnect, handler);
    }

    /** Closes currentDict connection and disables reconnects. */
    close = () => {
        this.socket.close();
    };

    open = () => {
        this.socket.open();
    };

    reset = () => {
        setTimeout(this.close);
        setTimeout(this.open);
    };
}

module.exports = SocketClient;
