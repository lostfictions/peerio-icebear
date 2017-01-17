/**
 * Configuration module.
 * Exists just to collect most of the app configuration aspects in one place.
 * ! Is not supposed be edited at runtime !
 * @module config
 */

const TinyDb = require('./db/tiny-db');

const config = new class {
    // -- development only
    debug = {
        trafficReportInterval: 60000,
        socketLogEnabled: false
    };
    //-------------------
    termsUrl = 'https://github.com/PeerioTechnologies/peerio-documentation/blob/master/Terms_of_Use.md';
    supportUrl = 'https://peerio.zendesk.com';

    socketServerUrl = 'wss://';
    upload = {
        chunkSize: 1024 * 512,
        maxEncryptQueue: 2, // max amount of chunks to pre-buffer for upload
        maxUploadQueue: 2, // max amount of chunks to pre-encrypt for sending
        maxResponseQueue: 2 // max amount of uploaded chunks waiting for server response
    };

    download = {
        chunkSize: 1024 * 1024, // amount of bytes to download at once for further processing
        maxParseQueue: 5,  // max amount of chunks to pre-buffer (download)
        maxDecryptQueue: 5  // max amount of chunks to extract and queue for decrypt
    };

    // -- client-specific implementations
    FileStream = null;
    set TinyDb(engine) {
        TinyDb.setEngine(engine);
    }
}();

// ICEBEAR_TEST_ENV is a constant replacement set by webpack
// this is only for running icebear unit tests
if (typeof (ICEBEAR_TEST_ENV) !== 'undefined') {
    config.socketServerUrl = ICEBEAR_TEST_ENV;
}

module.exports = config;
