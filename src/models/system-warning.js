const { observable, when, action } = require('mobx');
const socket = require('../network/socket');
const _ = require('lodash');
const { retryUntilSuccess } = require('../helpers/retry');
/**
 * Warnings that come from the icebear lib, not the server.
 */
// -------------------------------------------------------------
// Known actions:
//
// * UPGRADE - send user somewhere he can upgrade his account pan
// -------------------------------------------------------------
class SystemWarning {
    constructor(object) {
        this.content = object.content;
        this.data = object.data;
        // severity level: [medium, severe]
        // severe warnings should be displayed via dialog
        this.level = object.level;
        // title for message
        this.title = object.title;
        // buttons - array of locale string keys or objects with locale string keys and action names
        // for example [{label: 'button_upgrade', action:'UPGRADE'}, 'button_ok']
        this.buttons = object.buttons;
    }

    // override in child class if needed
    dispose() { }
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
    }

    dispose() {
        return retryUntilSuccess(() => socket.send('/auth/warning/clear', { token: this.token }));
    }
}

/**
 * Simple observable queue of server warnings.
 *
 * Used in desktop app by WarningController.
 */
class SystemWarningCollection {
    collection = observable([]);
    hash = {};

    @action add(data) {
        this.collection.push(new SystemWarning(data));
    }

    @action shift() {
        const last = this.collection.shift();
        if (last) {
            try {
                last.dispose();
            } catch (err) {
                console.log(err);
            }
        }
    }

    /**
     * Add a severe local warning helper
     * Used as a global error handler
     */
    @action addLocalWarningSevere(content, title, buttons) {
        this.add({ content, title, buttons, level: 'severe' });
    }

    /**
     *
     * @param serverData
     */
    @action.bound addServerWarning(serverData) {
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
