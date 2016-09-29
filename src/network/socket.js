// @flow
/**
 * Main SocketClient singleton instance
 * @module network/socket
 */

const SocketClient = require('./socket-client');
const config = require('../config');

const socket = new SocketClient(config.socketServerUrl);

module.exports = socket;
