const { Atom } = require('mobx');
const config = require('../config');

/**
 * Observable clock.
 * Provides clock.now property that is mobx observable and changes at specified time interval.
 * Doesn't tick when no one is observing.
 * Create your own clock or use default one.
 * @class Clock
 * @param {number} interval - clock update interval in seconds
 * @public
 */
class Clock {
    _atom;
    _intervalHandler = null;
    _lastTickValue;
    /**
     * Default clock instance with `config.observableClockEventFrequency` interval
     * @member {Clock}
     * @static
     * @public
     */
    static default;

    constructor(interval) {
        this._atom = new Atom('Clock', this._startTicking, this._stopTicking);
        this._interval = interval;
    }

    /**
     * Current timestamp. Observable. Updates every `this.interval` seconds
     * @member {number}
     * @public
     */
    get now() {
        if (this._atom.reportObserved()) {
            return this._lastTickValue;
        }
        return Date.now(); // in case this call is regular one, not observed
    }

    /**
     * Stops the clock, it can't be restarted after this.
     * @public
     */
    dispose() {
        this._stopTicking();
        this._atom = null;
    }

    _tick = () => {
        this._lastTickValue = Date.now();
        this._atom.reportChanged();
    };

    _startTicking = () => {
        this._tick(); // initial tick
        this._intervalHandler = setInterval(this._tick, this._interval * 1000);
    };

    _stopTicking = () => {
        clearInterval(this._intervalHandler);
        this._intervalHandler = null;
    }
}

Clock.default = new Clock(config.observableClockEventFrequency);

module.exports = Clock;
