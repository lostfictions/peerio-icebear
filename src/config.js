
/**
 * Configuration module.
 * Exists just to collect most of the app configuration aspects in one place.
 * Is not supposed be edited at runtime.
 * @module config
 */

const config = {
    // Default values for production apps
    socketServerUrl: 'wss://app.peerio.com',
    termsUrl: 'https://github.com/PeerioTechnologies/peerio-documentation/blob/master/Terms_of_Use.md',
    debug: {
        trafficReportInterval: 60000,
        socketLogEnabled: false
    }
};

// Build time flags/vars to override default values
if (typeof (process.env.NODE_ENV) !== 'undefined') {
    if (process.env.NODE_ENV !== 'production' &&
        typeof (process.env.STAGING_SOCKET_SERVER) !== 'undefined') {
        config.socketServerUrl = process.env.STAGING_SOCKET_SERVER;
    }
}

module.exports = config;
