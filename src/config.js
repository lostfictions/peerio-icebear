
/**
 * Configuration module.
 * Exists just to collect most of the app configuration aspects in one place.
 * Is not supposed be edited at runtime.
 * @module config
 */

const config = {
    // clients should override this
    socketServerUrl: 'wss://',
    termsUrl: 'https://github.com/PeerioTechnologies/peerio-documentation/blob/master/Terms_of_Use.md',
    supportUrl: 'https://peerio.zendesk.com',
    chunkSize: 1024 * 512,
    debug: {
        trafficReportInterval: 60000,
        socketLogEnabled: false
    }
};

// ICEBEAR_TEST_ENV is a constant replacement set by webpack
// this is only for running icebear unit tests
if (typeof (ICEBEAR_TEST_ENV) !== 'undefined') {
    config.socketServerUrl = ICEBEAR_TEST_ENV;
}

module.exports = config;
