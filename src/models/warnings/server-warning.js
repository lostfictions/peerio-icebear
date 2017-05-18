const { retryUntilSuccess } = require('../../helpers/retry');
const isKnownKey = require('peerio-translator').has;
const SystemWarning = require('./system-warning');
const socket = require('../../network/socket');
const L = require('l.js');

/**
 * Server warning. Server sends locale key and severity level for client to display.
 */
class ServerWarning extends SystemWarning {
    constructor(obj, onClear) {
        if (!obj.msg.startsWith('serverWarning_') || !isKnownKey(obj.msg)) {
            L.verbose(obj);
            throw new Error('Invalid/unknown warning key received from server.');
        }
        super(obj.msg, obj.title, null, obj.level);
        this.token = obj.token; // to use when dismissing/acknowleging server message
        this.onClear = onClear;
    }

    dispose() {
        return retryUntilSuccess(() => socket.send('/auth/warning/clear', { token: this.token }))
            .then(() => {
                if (this.onClear) this.onClear();
            });
    }
}

module.exports = ServerWarning;
