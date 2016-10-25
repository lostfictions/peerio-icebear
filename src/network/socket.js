
/**
 * Main SocketClient singleton instance
 * @module network/socket
 */

const SocketClient = require('./socket-client');
const config = require('../config');

const socket = new SocketClient();

const wrappedStart = socket.start;

console.log(config.socketServerUrl);

socket.start = function() {
    wrappedStart.call(socket, config.socketServerUrl);
};

module.exports = socket;
