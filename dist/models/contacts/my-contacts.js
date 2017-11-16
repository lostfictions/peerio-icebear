'use strict';

const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');

/**
 * User's favorite contacts. Named plaintext synced keg.
 * @extends {SyncedKeg}
 * @protected
 */
let MyContacts = class MyContacts extends SyncedKeg {

    constructor() {
        super('my_contacts', getUser().kegDb, true, true);
        this.contacts = {};
    }

    serializeKegPayload() {
        return {
            contacts: this.contacts
        };
    }

    deserializeKegPayload(payload) {
        this.contacts = payload.contacts;
    }

    /**
     * @param {Contact} contact
     * @returns {boolean} - true if contact was added, false if contact was already in the list.
     * @protected
     */
    addContact(contact) {
        if (this.contacts[contact.username]) return false;
        this.contacts[contact.username] = { addedAt: Date.now() };
        return true;
    }

    /**
     * @param {Contact} contact
     * @returns {boolean} - true if contact was removed, false if contact was not in the list.
     * @protected
     */
    removeContact(contact) {
        if (!this.contacts[contact.username]) return false;
        delete this.contacts[contact.username];
        return true;
    }
};


module.exports = MyContacts;