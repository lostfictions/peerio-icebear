const { Atom } = require('mobx');

/**
 * From the mobx docs 🎉. Use if needing to include current time in
 * an observable/computed.
 */
class TimeStore {
    atom;
    intervalHandler = null;
    currentTimestamp;

    constructor() {
        this.atom = new Atom(
            'Clock',
            () => this.startTicking(),
            () => this.stopTicking()
        );
    }

    getCurrentTime() {
        if (this.atom.reportObserved()) {
            return this.currentTimestamp;
        }
        return Date.now();
    }

    tick() {
        this.currentTimestamp = Date.now();
        this.atom.reportChanged();
    }

    startTicking() {
        this.tick();
        this.intervalHandler = setInterval(
            () => this.tick(),
            1000
        );
    }

    stopTicking() {
        clearInterval(this.intervalHandler);
        this.intervalHandler = null;
    }
}

module.exports = new TimeStore();
