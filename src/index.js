
/* eslint-disable no-unused-vars */
/**
 * Icebear client lib entry point
 */

// to extend Buffer module for future imports
require('./extensions/buffer');
require('./extensions/uint8array');

// to create socket client singleton instance
const socket = require('./network/socket');
const User = require('./models/user');
const PhraseDictionary = require('./models/phrase-dictionary');
const config = require('./config');
const cryptoUtil = require('./crypto/util');
const errors = require('./errors');

module.exports = {
    errors, config, socket, pCrypto: { util: cryptoUtil }, User
};
