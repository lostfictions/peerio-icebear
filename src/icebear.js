// @flow
/* eslint-disable no-unused-vars */
/**
 * Icebear client lib entry point
 */

// to extend Buffer module for future imports
const bufferExtensions = require('./extensions/buffer');
// to create socket client singleton instance
const socket = require('./network/socket');
const User = require('./models/user');

module.exports = {
    socket, User
};
