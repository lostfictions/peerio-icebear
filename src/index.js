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
const socket = require('./network/socket');
const User = require('./models/user');
const PhraseDictionary = require('./models/phrase-dictionary');
const config = require('./config');
const errors = require('./errors');
const contactStore = require('./models/contact-store');
const chatStore = require('./models/chat-store');
const fileStore = require('./models/file-store');
const validation = require('./helpers/validation/field-validation');
const FileStreamAbstract = require('./models/file-stream-abstract');
const util = require('./util');
const systemWarnings = require('./models/system-warning');
const crypto = require('./crypto');
const TinyDb = require('./db/tiny-db');

module.exports = {
    errors,
    config,
    socket,
    crypto,
    User,
    PhraseDictionary,
    TinyDb,
    contactStore,
    chatStore,
    fileStore,
    validation,
    FileStreamAbstract,
    util,
    systemWarnings
};
