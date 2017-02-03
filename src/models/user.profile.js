const Keg = require('./kegs/keg');

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
        this.user.addresses = data.addresses;
        this.user.isBlacklisted = data.isBlackListed;
        this.user.use2fa = data.user2fa;
    }
}


module.exports = function mixUserRegisterModule() {
    const _profileKeg = new UserProfile(this.kegDb, this);

    this.loadProfile = function() {
        console.log('Loading user profile.');
        return _profileKeg.load();
    };

    this.saveProfile = function() {
        console.log('Saving user profile.');
        return _profileKeg.saveToServer();
    };
};
