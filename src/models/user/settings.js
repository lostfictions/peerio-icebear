const Keg = require('../kegs/keg');
const { observable } = require('mobx');

class Settings extends Keg {
    @observable contactNotifications = false;
    @observable contactRequestNotifications = false;
    @observable messageNotifications = false;

    constructor(user) {
        super('settings', 'settings', user.kegDb, true);
        this.user = user;
    }

    serializeKegPayload() {
        return {
            contactNotifications: this.contactNotifications,
            contactRequestNotifications: this.contactRequestNotifications,
            messageNotifications: this.messageNotifications
        };
    }

    deserializeKegPayload(data) {
        this.contactNotifications = data.contactNotifications;
        this.contactRequestNotifications = data.contactRequestNotifications;
        this.messageNotifications = data.messageNotifications;
        this.loaded = true;
    }

}

module.exports = Settings;
