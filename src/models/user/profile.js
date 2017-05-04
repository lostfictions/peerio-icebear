const Keg = require('../kegs/keg');

class Profile extends Keg {
    constructor(user) {
        super('profile', 'profile', user.kegDb, true);
        this.user = user;
    }

    serializeKegPayload() {
        return {
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            locale: this.user.locale,
            primaryAddressValue: this.user.primaryAddress
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
        (data.addresses || []).forEach(a => {
            if (a.address === data.primaryAddressValue) a.primary = true;
        });
        // this is observable so we assign it after all modifications
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
        this.user.profileLoaded = true;
    }
}

module.exports = Profile;
