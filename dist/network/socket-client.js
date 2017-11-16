'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

//
// WebSocket client module.
// This module exports SocketClient class that can be instantiated as many times as needed.
//

const io = require('socket.io-client/dist/socket.io');
const { ServerError, DisconnectedError, NotAuthenticatedError } = require('../errors');
const { observable } = require('mobx');
const config = require('../config');
const util = require('../util');
const Timer = require('../helpers/observable-timer');
const { getUser } = require('../helpers/di-current-user');
const TaskPacer = require('../helpers/task-pacer');

const STATES = {
    open: 'open',
    opening: 'opening',
    closed: 'closed',
    closing: 'closing'
};

// socket.io event
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

// application events sent by app server
const APP_EVENTS = {
    kegsUpdate: 'kegsUpdate',
    serverWarning: 'serverWarning',
    // clearWarning: 'clearWarning',
    channelInvitesUpdate: 'channelInvitesUpdate',
    channelDeleted: 'channelDeleted'
};

/**
 * Use socket.js to get the default instance of SocketClient, unless you do need a separate connection for some reason.
 *
 * SocketClient emits many events, main ones are:
 * - **started** - whenever socket.start() is called the first time.
 * - **connect** - every time connection has been established.
 * - **authenticated** - when connection is fully authenticated and ready to work.
 * - **disconnect** - every time connection has been broken.
 *
 * The rest you can find in sources:
 * - **SOCKET_EVENTS** - whatever is happening with socket.io instance
 * - **APP_EVENTS** - server emits them
 * @public
 */
let SocketClient = (_class = class SocketClient {
    constructor() {
        this.socket = null;
        this.taskPacer = new TaskPacer(40);
        this.started = false;
        this.url = null;

        _initDefineProp(this, 'connected', _descriptor, this);

        this.preauthenticated = false;

        _initDefineProp(this, 'authenticated', _descriptor2, this);

        _initDefineProp(this, 'throttled', _descriptor3, this);

        _initDefineProp(this, 'reconnectAttempt', _descriptor4, this);

        _initDefineProp(this, 'reconnecting', _descriptor5, this);

        _initDefineProp(this, 'latency', _descriptor6, this);

        this.reconnectTimer = new Timer();
        this.bytesReceived = 0;
        this.bytesSent = 0;
        this.requestId = 0;
        this.awaitingRequests = {};
        this.authenticatedEventListeners = [];
        this.startedEventListeners = [];
        this.STATES = STATES;
        this.SOCKET_EVENTS = SOCKET_EVENTS;
        this.APP_EVENTS = APP_EVENTS;

        this.close = () => {
            this.socket.close();
        };

        this.open = () => {
            this.socket.open();
        };

        this.resetReconnectTimer = () => {
            if (this.connected || this.reconnecting || this.reconnectTimer.counter < 2) return;
            this.backupAttempts = this.socket.io.backoff.attempts;
            this.reset();
        };

        this.reset = () => {
            if (this.resetting) return;
            this.resetting = true;

            this.reconnecting = true;
            this.reconnectTimer.stop();

            setTimeout(this.close);
            const interval = setInterval(() => {
                if (this.state !== STATES.closed) return;
                this.open();
                this.resetting = false;
                clearInterval(interval);
            }, 1000);
        };
    }
    /**
     * Socket.io client instance
     * @private
     */
    // todo: maybe move to config
    /**
     * Was socket started or not
     * @public
     */

    /**
     * Connection url this socket uses. Readonly.
     * @public
     */

    /**
     * Observable connection state.
     * @member {boolean} connected
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * This flag means that connection has technically been authenticated from server's perspective,
     * but client is still initializing, loading boot keg and other important data needed before starting any other
     * processes and setting socket.authenticated to true.
     * @member {boolean}
     * @private
     */

    /**
     * Observable. Normally you want to use socket when it's authenticated rather then just connected.
     * @member {boolean} authenticated
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * Observable. Is the connection currently throttled by server.
     * @member {boolean} throttled
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * Observable. In case reconnection attempt failed, this property will reflect current attempt number.
     * @member {number} reconnectAttempt
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * Observable. Shows if reconnecting process is in progress.
     * @member {boolean} reconnecting
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * Observable. Shows current server response time in milliseconds. This is not a network ping,
     * this is a time needed for a websocket message to do a round trip.
     * @member {number} latency
     * @instance
     * @memberof SocketClient
     * @public
     */

    /**
     * Countdown to the next reconnect attempt.
     * @member {Timer}
     * @public
     */


    // for debug (if enabled)
    // DON'T MAKE THIS OBSERVABLE
    // At some conditions it creates cyclic reactions with autorun
    /**
     * Total amount of bytes received since socket was created.
     * Note that this is not including file downloads, because downloads go through https.
     * @member {number}
     * @public
     */

    /**
     * Total amount of bytes sent since socket was created.
     * @member {number}
     * @public
     */

    /**
     * Just an incrementing with every request number to be able to identify server responses.
     * @private
     */

    /**
     * Awaiting requests map.
     * @private
     */
    // {number: function}

    /**
     * List of 'authenticated' event handlers.
     * @private
     */

    /**
     * List of 'started' event handlers.
     * @private
     */

    // following properties are not static for access convenience
    /**
     * Possible connection states
     * @public
     */

    /**
     * Socket lifecycle events
     * @public
     */

    /**
     * Application server events
     * @public
     */


    /**
     * Initializes the SocketClient instance, creates wrapped socket.io instance and so on.
     * @param {string} url
     * @public
     */
    start(url) {
        if (this.started) return;
        console.log(`Starting socket: ${url}`);
        const self = this;
        this.url = url;
        this.started = true;
        this.preauthenticated = false;
        this.authenticated = false;
        // <DEBUG>
        if (config.debug && config.debug.trafficReportInterval > 0) {
            const s = WebSocket.prototype.send;
            WebSocket.prototype.send = function (msg) {
                self.bytesSent += msg.length || msg.byteLength || 0;
                if (config.debug.socketLogEnabled && typeof msg === 'string') {
                    console.log('OUTGOING SOCKET MSG:', msg);
                }
                return s.call(this, msg);
            };
            setInterval(() => {
                console.log('SENT:', util.formatBytes(self.bytesSent), 'RECEIVED:', util.formatBytes(self.bytesReceived));
            }, config.debug.trafficReportInterval);
        }
        // </DEBUG>

        const socket = this.socket = io.connect(url, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 9000,
            randomizationFactor: 0,
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
            this.reconnecting = false;
        });

        socket.on('disconnect', () => {
            console.log('\ud83d\udc94 Socket disconnected.');
            this.preauthenticated = false;
            this.authenticated = false;
            this.connected = false;
            this.reconnecting = true;
            clearBuffers();
            this.cancelAwaitingRequests();
        });

        socket.on('reconnect_attempt', num => {
            if (this.backupAttempts) {
                this.reconnectAttempt = this.backupAttempts;
                this.socket.io.backoff.attempts = this.backupAttempts;
                this.backupAttempts = 0;
            } else {
                this.reconnectAttempt = num;
            }
            this.reconnecting = true;
        });

        socket.on('pong', latency => {
            this.latency = latency;
        });

        socket.on('reconnect_error', () => {
            this.reconnecting = false;
            // HACK: backoff.duration() will increase attempt count, so we balance that
            this.socket.io.backoff.attempts--;
            this.reconnectTimer.countDown(this.socket.io.backoff.duration() / 1000);
        });

        socket.open();

        this.startedEventListeners.forEach(l => setTimeout(l));
        this.startedEventListeners = [];
    }

    configureDebugLogger() {
        if (config.debug && config.debug.trafficReportInterval > 0) {
            this.socket.io.engine.addEventListener('message', msg => {
                this.bytesReceived += msg.length || msg.byteLength || 0;
                if (config.debug.socketLogEnabled && typeof msg === 'string') {
                    console.log('INCOMING SOCKET MSG:', msg);
                }
            });
        }
    }

    /**
     * Returns connection state, one of {@link STATES}
     * @member {string}
     * @public
     */
    get state() {
        // unknown states translated to 'closed' for safety
        return STATES[this.socket.io.readyState] || STATES.closed;
    }

    /**
     * Internal function to do what it says
     * @private
     */
    setAuthenticatedState() {
        // timeout to make sure code that call this does what it needs to before mobx reaction triggers
        setTimeout(() => {
            if (this.state !== STATES.open) return;
            this.authenticated = true;
            this.authenticatedEventListeners.forEach(listener => {
                setTimeout(listener);
            });
        });
    }

    /**
     * Internal function to do what it says
     * @private
     */
    validateSubscription(event, listener) {
        if (!SOCKET_EVENTS[event] && !APP_EVENTS[event]) {
            throw new Error('Attempt to un/subscribe from/to unknown socket event.');
        }
        if (!listener || typeof listener !== 'function') {
            throw new Error('Invalid listener type.');
        }
    }
    /**
     * Subscribes a listener to one of the socket or app events.
     * @param {string} event - event name, one of SOCKET_EVENTS or APP_EVENTS
     * @param {function} listener - event handler
     * @returns {function} function you can call to unsubscribe
     * @public
     */
    subscribe(event, listener) {
        this.validateSubscription(event, listener);
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

    /**
     * Unsubscribes socket or app events listener.
     * @param {string} event - event name, one of SOCKET_EVENTS or APP_EVENTS
     * @param {function} listener - event handler
     * @public
     */
    unsubscribe(event, listener) {
        this.validateSubscription(event, listener);
        if (event === SOCKET_EVENTS.authenticated) {
            const ind = this.authenticatedEventListeners.indexOf(listener);
            if (ind < 0) return;
            this.authenticatedEventListeners.splice(ind, 1);
        } else {
            this.socket.off(event, listener);
        }
    }

    /**
     * Send a message to server
     * @param {string} name - api method name
     * @param {any=} data - data to send
     * @returns {Promise<Object>} - server response, always returns `{}` if response is empty
     * @public
     */
    send(name, data) {
        const id = this.requestId++;
        return new Promise((resolve, reject) => {
            this.awaitingRequests[id] = reject;
            this.taskPacer.run(() => {
                if (!this.awaitingRequests[id]) {
                    // promise timed out while waiting in queue
                    return;
                }
                if (!this.connected) {
                    console.error(`Attempt to send ${name} while disconnected`);
                    reject(new DisconnectedError());
                    return;
                }
                if (name.startsWith('/auth/') && !this.preauthenticated) {
                    console.error(`Attempt to send ${name} while not authenticated`);
                    reject(new NotAuthenticatedError());
                    return;
                }
                const handler = resp => {
                    this.throttled = resp.error === 425;
                    if (resp && resp.error) {
                        if (resp.error === ServerError.codes.accountClosed) {
                            getUser().deleted = true;
                            this.close();
                        }
                        if (resp.error === ServerError.codes.accountBlacklisted) {
                            getUser().blacklisted = true;
                            this.close();
                        }
                        reject(new ServerError(resp.error, resp.message));
                        return;
                    }
                    resolve(resp);
                };
                // console.debug(id, name, data);
                this.socket.emit(name, data, handler);
            });
        }).timeout(60000).finally(() => {
            delete this.awaitingRequests[id];
        });
    }

    /**
     * Rejects promises and clears all awaiting requests (in case of disconnect)
     * @private
     */
    cancelAwaitingRequests() {
        const err = new DisconnectedError();
        for (const id in this.awaitingRequests) {
            this.awaitingRequests[id](err);
        }
        this.awaitingRequests = {};
    }

    /**
     * Executes a callback only once when socket will connect.
     * If socket is already connected, callback will be scheduled to run ASAP.
     * @param {function} callback
     * @public
     */
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

    /**
     * Executes a callback only once when socket will authenticate.
     * If socket is already authenticated, callback will be scheduled to run ASAP.
     * @param {function} callback
     * @public
     */
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

    /**
     * Executes a callback once socket is started.
     * If socket is already started, callback will be scheduled to run ASAP.
     * @param {function} callback
     * @public
     */
    onceStarted(callback) {
        if (this.started) {
            setTimeout(callback, 0);
            return;
        }
        this.startedEventListeners.push(callback);
    }

    /**
     * Shortcut to frequently used 'authenticated' subscription.
     * Does not call handler if socket is already authenticated, only subscribes to future events.
     * @param {function} handler
     * @returns {function} unsubscribe function
     * @public
     */
    onAuthenticated(handler) {
        return this.subscribe(SOCKET_EVENTS.authenticated, handler);
    }

    /**
     * Shortcut to frequently used 'disconnect' subscription.
     * Does not call handler if socket is already disconnected, only subscribes to future events.
     * @param {function} handler
     * @returns {function} unsubscribe function
     * @public
     */
    onDisconnect(handler) {
        return this.subscribe(SOCKET_EVENTS.disconnect, handler);
    }

    /**
     * Closes current connection and disables reconnects until open() is called.
     * @public
     */


    /**
     * Opens a new connection. (Or does nothing if already open)
     * @public
     */


    /**
     * Internal function to do what it says
     * @private
     */


    /**
     * Closes connection and opens it again.
     * @public
     */
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'connected', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'authenticated', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'throttled', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'reconnectAttempt', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'reconnecting', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'latency', [observable], {
    enumerable: true,
    initializer: function () {
        return 0;
    }
})), _class);


module.exports = SocketClient;