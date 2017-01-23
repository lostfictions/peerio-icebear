/**
 * Icebear client lib entry point
 */

// replacing native Promise with bluebird implementation
const Promise = require('bluebird');

if (typeof window !== 'undefined') {
    window.Promise = Promise;
}

if (typeof global !== 'undefined') {
    global.Promise = Promise;
}

Promise.config({
    // Enables all warnings except forgotten return statements.
    warnings: {
        wForgottenReturn: false
    }
});

// extending native classes
require('./extensions/uint8array');

// exporting Icebear Library Interface
const socket = require('./network/socket')();
const User = require('./models/user');
const PhraseDictionary = require('./models/phrase-dictionary');
const config = require('./config');
const cryptoUtil = require('./crypto/util');
const errors = require('./errors');
const contactStore = require('./models/stores/contact-store');
const chatStore = require('./models/stores/chat-store');
const fileStore = require('./models/stores/file-store');
const mailStore = require('./models/stores/mail-store');
const validation = require('./helpers/validation/field-validation');
const FileStreamAbstract = require('./models/file-stream-abstract');
const util = require('./util');
const systemWarnings = require('./models/system-warning');
const cryptoKeys = require('./crypto/keys');
const cryptoPublic = require('./crypto/public');
const cryptoSecret = require('./crypto/secret');
const TinyDb = require('./db/tiny-db');

module.exports = {
    errors,
    config,
    socket,
    cryptoUtil,
    cryptoKeys,
    cryptoPublic,
    cryptoSecret,
    User,
    PhraseDictionary,
    TinyDb,
    contactStore,
    chatStore,
    fileStore,
    mailStore,
    validation,
    FileStreamAbstract,
    util,
    systemWarnings
};
