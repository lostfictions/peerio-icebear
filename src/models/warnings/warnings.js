const { observable, action } = require('mobx');
const socket = require('../../network/socket');
const SystemWarning = require('./system-warning');
const ServerWarning = require('./server-warning');

/**
 * Simple observable queue of server warnings.
 */
class Warnings {
    /** Clients should watch this and render new snackbar/dialog on change */
    @observable current;
    // warnings waiting to be shown
    queue = [];

    /** Disposes current warning and pops next one from the queue */
    @action next() {
        if (this.current) {
            try {
                this.current.dispose();
            } catch (err) {
                console.log(err);
            }
        }
        this.current = this.queue.shift();
    }

    /**
     * Generic method to add warnings
     * @param {string} content - translation key
     * @param {string} [title] - optional translation key for title, will not be shown in snackbars
     * @param {object} [data] - variables to pass to translator
     * @param {string} [level='medium'] - severity level
     */
    @action add(content, title, data, level = 'medium') {
        this.queue.push(new SystemWarning(content, title, data, level));
        if (!this.current) this.next();
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
            this.queue.push(new ServerWarning(serverObj));
            if (!this.current) this.next();
        } catch (e) {
            console.error(e);
        }
    }
}

const w = new Warnings();

socket.onceStarted(() => socket.subscribe(socket.APP_EVENTS.serverWarning, w.addServerWarning));

module.exports = w;
