/**
 * Icebear client lib entry point
 */

// replacing native Promise with bluebird implementation
const Promise = require('bluebird');

if (typeof window !== 'undefined') {
    window.Promise = Promise;
}

if (typeof global !== 'undefined') {
    // noinspection JSAnnotator
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
const PhraseDictionaryCollection = require('./models/phrase-dictionary');
const config = require('./config');
const errors = require('./errors');
const contactStore = require('./models/stores/contact-store');
const chatStore = require('./models/stores/chat-store');
const fileStore = require('./models/stores/file-store');
const mailStore = require('./models/stores/mail-store');
const validation = require('./helpers/validation/field-validation');
const FileStreamAbstract = require('./models/files/file-stream-abstract');
const FileNonceGenerator = require('./models/files/file-nonce-generator');
const util = require('./util');
const systemWarnings = require('./models/system-warning');
const crypto = require('./crypto');
const TinyDb = require('./db/tiny-db');
const legacyMigrator = require('./legacy/account_migrator');
const defaultClock = require('./helpers/observable-clock').default;
const Clock = require('./helpers/observable-clock').Clock;

module.exports = {
    errors,
    config,
    socket,
    crypto,
    User,
    PhraseDictionaryCollection,
    TinyDb,
    contactStore,
    chatStore,
    fileStore,
    mailStore,
    validation,
    FileStreamAbstract,
    FileNonceGenerator,
    util,
    systemWarnings,
    legacyMigrator,
    defaultClock,
    Clock
};
