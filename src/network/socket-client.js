// @flow
/**
 * Peerio network socket client module.
 * This module exports SocketSlient class that can be instantiated as many times as needed.
 * Other modules contain singleton instances for general use.
 * @module network/socket-client
 */

const io = require('socket.io-client/socket.io');
const Promise = require('bluebird');
const { ServerError } = require('../errors');

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
class SocketClient {
    socket: Object;
    authenticated: bool;
    started: bool = false;

    /** Possible connection states */
    static states = states;
    /** System events */
    static events = socketEvents;
    /** Application events */
    static appEvents = appEvents;

    start(url: string) {
        if (this.started) return;
        this.started = true;

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

        socket.open();
    }

    /** Returns connection state */
    get state(): string {
        if (this.socket.readyState === states.open && this.authenticated) {
            return states.authenticated;
        }
        // unknown states translated to 'closed' for safety
        return states[this.socket.readyState] || states.closed;
    }

    _validateSubscription(event: string, listener: Function) {
        if (!socketEvents[event] && !appEvents[event]) {
            throw new Error('Attempt to un/subscribe from/to unknown socket event.');
        }
        if (!listener || typeof (listener) !== 'function') {
            throw new Error('Invalid listener type.');
        }
    }
    /** Subscribes a listener to one of the socket or app events */
    subscribe(event: string, listener: Function) {
        this._validateSubscription(event, listener);
        this.socket.on(event, listener);
    }

    /** Unsubscribes a listener to socket or app events */
    unsubscribe(event: string, listener: Function) {
        this._validateSubscription(event, listener);
        this.socket.off(event, listener);
    }

    /** Send a message to server */
    send(name: string, data: any): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
            function handler(resp: any) {
                if (resp && resp.error) {
                    reject(new ServerError(resp.error));
                    return;
                }
                resolve(resp);
            }
            this.socket.emit(name, data, handler);
        });
    }
    /** Executes a callback only once when socket will connect, or immediatelly if socket is connected already */
    onceConnected(callback: Function) {
        if (this.socket.connected) {
            setTimeout(callback, 0);
            return;
        }
        const handler = () => {
            setTimeout(callback, 0);
            this.unsubscribe(socketEvents.connect, handler);
        };
        this.subscribe(socketEvents.connect, handler);
    }

    /** Closes current connection and disables reconnects. */
    close() {
        this.socket.close();
    }
}

module.exports = SocketClient;
