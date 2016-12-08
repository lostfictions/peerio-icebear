const { observable, computed } = require('mobx');
const socket = require('../network/socket');

/**
 * Server warning with properties from the server.
 *
 * Eventually extendable, e.g. with custom action depending on the server warning message.
 */
class ServerWarning {
    constructor(object) {
        this.action = this.action.bind(this);
        this.content = object.msg;
        this.token = object.token;
        this.data = object.data;
        this.label = 'ok';
    }

    action() {
        return socket.send('/auth/clearWarning', { token: this.token });
    }
}

/**
 * Simple observable queue of server warnings.
 *
 * Used in desktop app by SnackbarControl. 
 */
class ServerWarningCollection {
    collection = observable([]);

    add(serverData) {
        this.collection.push(new ServerWarning(serverData));
    }

    constructor() {
        this.add = this.add.bind(this);
    }
}

const s = new ServerWarningCollection();

module.exports = s;
