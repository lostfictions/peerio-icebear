const Keg = require('./kegs/keg');


class Receipt extends Keg {
    constructor(db) {
        super(null, 'receipt', db);
    }

    serializeKegPayload() {
        return {
            position: this.position
        };
    }

    deserializeKegPayload(payload) {
        this.position = payload.position;
    }

    serializeProps() {
        return {
            username: this.username
        };
    }

    deserializeProps(props) {
        this.username = props.username;
    }
}

module.exports = Receipt;
