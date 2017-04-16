const { observable, action, when, reaction } = require('mobx');
const socket = require('../../network/socket');
const SystemWarning = require('./system-warning');
const ServerWarning = require('./server-warning');
const clientApp = require('../client-app');

/**
 * Simple observable queue of server warnings.
 */
class Warnings {
    /** Clients should watch this and render new snackbar/dialog on change */
    @observable current;

    // warnings waiting to be shown
    _queue = [];

    constructor() {
        reaction(() => clientApp.isFocused, isFocused => {
            if (!this.current || this.current.level !== 'medium') return;
            if (isFocused) {
                this.current.autoDismiss();
            } else {
                this.current.cancelAutoDismiss();
            }
        });
    }

    // adds warning to internal queue
    _queueItem(warning) {
        if (warning.level === 'severe') {
            this._queue.unshift(warning);
        } else {
            this._queue.push(warning);
        }
        if (!this.current) {
            this._assignNextItem();
        }
    }

    // gets item from queue and makes it current
    _assignNextItem = () => {
        this.current = this._queue.shift();
        if (!this.current) return;
        when(() => this.current.state === SystemWarning.STATES.DISMISSED, this._assignNextItem);
        if (this.current.level === 'medium' && clientApp.isFocused) this.current.autoDismiss();
        this.current.show();
    }
    /**
     * Generic method to add warnings
     * @param {string} content - translation key
     * @param {string} [title] - optional translation key for title, will not be shown in snackbars
     * @param {object} [data] - variables to pass to translator
     * @param {string} [level='medium'] - severity level
     */
    @action add(content, title, data, level = 'medium') {
        this._queueItem(new SystemWarning(content, title, data, level));
    }

    /**
     * Shortcut to add severe warnings without specifying severity level explicitly
     * @see add
     */
    @action addSevere(content, title, data) {
        this.add(content, title, data, 'severe');
    }

    /**
     * Exposed mostly for testing, should not be used by clients directly
     */
    @action.bound addServerWarning(serverObj) {
        try {
            this._queueItem(new ServerWarning(serverObj));
        } catch (e) {
            console.error(e); // try/catch protects from invalid data sent from server
        }
    }
}

const w = new Warnings();

socket.onceStarted(() => socket.subscribe(socket.APP_EVENTS.serverWarning, w.addServerWarning));

module.exports = w;
