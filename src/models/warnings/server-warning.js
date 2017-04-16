const { retryUntilSuccess } = require('../../helpers/retry');
const isKnownKey = require('peerio-translator').has;
const SystemWarning = require('./system-warning');
const socket = require('../../network/socket');

/**
 * Server warning. Server sends locale key and severity level for client to display.
 */
class ServerWarning extends SystemWarning {
    constructor(obj) {
        if (!obj.msg.startsWith('serverWarning_') || !isKnownKey(obj.msg)) {
            console.debug(obj);
            throw new Error('Invalid/unknown warning key received from server.');
        }
        super(obj.msg, obj.title, obj.level, null);
        this.token = obj.token; // to use when dismissing/acknowleging server message
    }

    dispose() {
        return retryUntilSuccess(() => socket.send('/auth/warning/clear', { token: this.token }));
    }
}

module.exports = ServerWarning;
