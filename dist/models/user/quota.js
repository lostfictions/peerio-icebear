'use strict';

const Keg = require('../kegs/keg');

/**
 * Plaintext readonly system named keg.
 * @param {User} user
 * @extends {Keg}
 * @protected
 */
let Quota = class Quota extends Keg {
    constructor(user) {
        super('quotas', 'quotas', user.kegDb, true);
        this.user = user;
    }

    deserializeKegPayload(data) {
        this.user.quota = data;
    }
};


module.exports = Quota;