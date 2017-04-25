const Keg = require('../kegs/keg');

class Quota extends Keg {
    constructor(user) {
        super('quotas', 'quotas', user.kegDb, true);
        this.user = user;
    }

    deserializeKegPayload(data) {
        this.user.quota = data;
    }
}

module.exports = Quota;
