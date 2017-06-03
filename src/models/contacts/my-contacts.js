const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');

// List of user's chats macro data/flags
class MyContacts extends SyncedKeg {

    contacts = {};

    constructor() {
        super('my_contacts', getUser().kegDb, true, true);
    }

    serializeKegPayload() {
        return {
            contacts: this.contacts
        };
    }

    deserializeKegPayload(payload) {
        this.contacts = payload.contacts;
    }


    addContact(contact) {
        if (this.contacts[contact.username]) return false;
        this.contacts[contact.username] = { addedAt: Date.now() };
        return true;
    }

    removeContact(contact) {
        if (!this.contacts[contact.username]) return false;
        delete this.contacts[contact.username];
        return true;
    }
}


module.exports = MyContacts;
