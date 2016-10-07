// @flow
/**
 * Configuration module.
 * Exists just to collect most of the app configuration aspects in one place.
 * Is not supposed be edited at runtime.
 * @module config
 */

// Default values for production apps
let socketServerUrl = 'wss://app.peerio.com';
//---------------------------------------------

// Build time flags/vars to override default values
if (typeof (ENV) !== 'undefined') {
    if (ENV === 'dev' && typeof (STAGING_SOCKET_SERVER) !== 'undefined') {
        socketServerUrl = STAGING_SOCKET_SERVER;
    }
}
//---------------------------------------

class Config {
    get socketServerUrl(): string {
        return socketServerUrl;
    }
    set socketServerUrl(val: string) {
        socketServerUrl = val;
    }
}

module.exports = new Config();
