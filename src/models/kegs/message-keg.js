const Keg = require('./keg');

class MessageKeg extends Keg {
    constructor(db) {
        super(db, null, 'message');
    }
}

module.exports = MessageKeg;
