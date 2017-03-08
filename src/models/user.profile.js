const { observable } = require('mobx');
const Keg = require('./kegs/keg');

class UserQuotas extends Keg {
    constructor(db, user) {
        super('quotas', 'quotas', db, true);
        this.user = user;
    }

    deserializeKegPayload(data) {
        console.log('user.profile.js: quotas');
        console.log(data);
        this.user.quotas = observable.map(data);
    }
}

class UserProfile extends Keg {
    constructor(db, user) {
        super('profile', 'profile', db, true);
        this.user = user;
    }

    serializeKegPayload() {
        return {
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            locale: this.user.locale
        };
    }

    deserializeKegPayload(data) {
        this.user.firstName = data.firstName;
        this.user.lastName = data.lastName;
        this.user.createdAt = data.created;
        this.user.locale = data.locale;
        this.user.isDeleted = data.deleted;
        this.user.primaryAddress = data.primaryAddressValue;
        this.user.primaryAddressType = data.primaryAddressType;
        this.user.addresses = data.addresses || [];
        this.user.primaryAddressConfirmed = false;
        for (let i = 0; i < this.user.addresses.length; i++) {
            const a = this.user.addresses[i];
            if (a.address !== this.user.primaryAddress) continue;
            this.user.primaryAddressConfirmed = a.confirmed;
            break;
        }
        this.user.isBlacklisted = data.isBlackListed;
        this.user.use2fa = data.user2fa;
    }
}

module.exports = function mixUserRegisterModule() {
    const _profileKeg = new UserProfile(this.kegDb, this);
    const _quotasKeg = new UserQuotas(this.kegDb);

    this.loadProfile = function() {
        console.log('Loading user profile.');
        return Promise.all([_profileKeg.load(), _quotasKeg.load()]);
    };

    this.saveProfile = function() {
        console.log('Saving user profile.');
        return _profileKeg.saveToServer();
    };
};
