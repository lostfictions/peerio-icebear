const Keg = require('./keg');

class MessageKeg extends Keg {
    constructor(db, id) {
        super(db, id, 'message');
    }
}

module.exports = MessageKeg;
