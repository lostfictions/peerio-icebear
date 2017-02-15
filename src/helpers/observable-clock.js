const { Atom } = require('mobx');
const config = require('../config');

/**
 * Observable clock.
 * Provides clock.now property that is mobx observable and changes at specified time interval.
 * Create your own clock or use default one.
 */
class Clock {
    _atom;
    _intervalHandler = null;
    _lastTickValue;

    /**
     * @param {number} interval - clock update interval in seconds
     */
    constructor(interval) {
        this._atom = new Atom('Clock', this._startTicking, this._stopTicking);
        this._interval = interval;
    }

    /**
     * @return {number} current timestamp (can be late up to this.interval seconds)
     */
    get now() {
        if (this._atom.reportObserved()) {
            return this._lastTickValue;
        }
        return Date.now(); // in case this call is regular one, not observed
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

exports.Clock = Clock;
exports.default = new Clock(config.observableClockEventFrequency);
