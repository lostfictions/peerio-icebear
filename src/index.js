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

// Enables all warnings except forgotten return statements.
Promise.config({
    warnings: {
        wForgottenReturn: false
    }
});

// extending native classes
require('./extensions/uint8array');

// exporting Icebear Library Interface
const socket = require('./network/socket');
const User = require('./models/user/user');
const PhraseDictionary = require('./models/phrase-dictionary');
const config = require('./config');
const errors = require('./errors');
const contactStore = require('./models/contacts/contact-store');
const chatStore = require('./models/chats/chat-store');
const fileStore = require('./models/files/file-store');
const ghostStore = require('./models/mail/ghost-store');
const mailStore = require('./models/mail/mail-store');
const validation = require('./helpers/validation/field-validation');
const FileStreamAbstract = require('./models/files/file-stream-abstract');
const FileNonceGenerator = require('./models/files/file-nonce-generator');
const util = require('./util');
const warnings = require('./models/warnings');
const crypto = require('./crypto');
const TinyDb = require('./db/tiny-db');
const defaultClock = require('./helpers/observable-clock').default;
const Clock = require('./helpers/observable-clock').Clock;
const fileHelpers = require('./helpers/file');
const MRUList = require('./helpers/mru-list');
const warningStates = require('./models/warnings/system-warning').STATES;
const clientApp = require('./models/client-app');
const systemMessages = require('./helpers/system-messages');

const serverSettings = require('./models/server-settings');

// MEMO: Do NOT export NodeJsonStorage and NodeFileStream here for compatibility reasons
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
    ghostStore,
    mailStore,
    validation,
    FileStreamAbstract,
    FileNonceGenerator,
    util,
    warnings,
    warningStates,
    defaultClock,
    Clock,
    fileHelpers,
    MRUList,
    clientApp,
    systemMessages,
    serverSettings
};
