const { observable, computed } = require('mobx');
const socket = require('../network/socket')();
const _ = require('lodash');

/**
 * Warnings that come from the icebear lib, not the server.
 */
class SystemWarning {
    constructor(object) {
        this.content = object.content;
        this.data = object.data;
        this.label = 'ok';
    }
}

/**
 * Server warning with properties from the server.
 *
 * Eventually extendable, e.g. with custom action depending on the server warning message.
 */
class ServerWarning extends SystemWarning {
    constructor(object) {
        super(object);
        this.content = object.msg;
        this.token = object.token;
        this.action = this.action.bind(this);
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
class SystemWarningCollection {
    collection = observable([]);

    constructor() {
        _.bindAll(this, ['add', 'addServerWarning']);
    }

    add(data) {
        this.collection.push(new SystemWarning(data));
    }

    addServerWarning(serverData) {
        this.collection.push(new ServerWarning(serverData));
    }
}

const s = new SystemWarningCollection();

module.exports = s;
