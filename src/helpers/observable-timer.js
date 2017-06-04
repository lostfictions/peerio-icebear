/**
 * Observable timer countup/down
 */
const { observable } = require('mobx');

class Timer {
    @observable counter = 0;

    countUp(seconds) {
        this.counter = 0;
        this._max = Math.round(seconds);
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(this._increment, 1000);
    }
    countDown(seconds) {
        this.counter = Math.round(seconds);
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(this._decrement, 1000);
    }

    stop() {
        if (this._interval) clearInterval(this._interval);
        this.counter = 0;
    }

    _increment = () => {
        if (this.counter >= this._max) {
            clearInterval(this._interval);
            return;
        }
        this.counter++;
    };
    _decrement = () => {
        if (this.counter <= 0) {
            clearInterval(this._interval);
            return;
        }
        this.counter--;
    };
}


module.exports = Timer;
