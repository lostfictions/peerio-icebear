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
const db = require('./db/tiny-db');
const contactStore = require('./models/contact-store');
const chatStore = require('./models/chat-store');

module.exports = {
    errors,
    config,
    socket,
    cryptoUtil,
    User,
    PhraseDictionary,
    db,
    setTinyDbEngine: db.setEngine,
    contactStore,
    chatStore
};
