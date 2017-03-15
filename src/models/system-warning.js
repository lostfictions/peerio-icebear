const { observable, when } = require('mobx');
const socket = require('../network/socket');
const _ = require('lodash');

/**
 * Warnings that come from the icebear lib, not the server.
 */
class SystemWarning {
    constructor(object) {
        this.content = object.content;
        this.data = object.data;
        this.label = 'ok';
        // severity level: [medium, severe]
        // severe warnings should be displayed via dialog
        this.level = object.level;
        // title for message
        this.title = object.title;
        // buttons - array of strings
        // for example ['upgrade', 'ok']
        this.buttons = object.buttons;
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
        return socket.send('/auth/warning/clear', { token: this.token });
    }
}

/**
 * Simple observable queue of server warnings.
 *
 * Used in desktop app by SnackbarControl.
 */
class SystemWarningCollection {
    collection = observable([]);
    hash = {};

    constructor() {
        _.bindAll(this, ['add', 'addServerWarning']);
    }

    add(data) {
        this.collection.push(new SystemWarning(data));
    }

    /**
     * Add a severe local warning helper
     * Used as a global error handler
     */
    addLocalWarningSevere(content, title, buttons) {
        this.add({ content, title, buttons, level: 'severe' });
    }

    addServerWarning(serverData) {
        const token = serverData.token;
        if (token && this.hash[token]) {
            return;
        }
        const warning = new ServerWarning(serverData);
        this.hash[token] = warning;
        this.collection.push(warning);
    }
}

const s = new SystemWarningCollection();

when(() => socket.connected, () => {
    socket.subscribe(socket.APP_EVENTS.serverWarning, s.addServerWarning);
});

module.exports = s;
