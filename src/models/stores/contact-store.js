const { observable, when } = require('mobx');
const Contact = require('../contact');
const { setContactStore } = require('../../helpers/di-contact-store');
/**
 * Contact(Peerio user) information store.
 * Currently provides access to any public profiles and caches lookups.
 */
class ContactStore {
    /** @type {Array<Contact>} - A list of Contact objects that were requested in currentDict session. (cache) */
    @observable contacts = [];

    /**
     * Returns Contact object ether from cache or server.
     * Reactive.
     * @param {string} username
     * @returns {Contact}
     */
    getContact(username) {
        const existing = this._findInCache(username);
        if (existing) return existing;

        const c = new Contact(username);
        this.contacts.unshift(c);
        when(() => !c.loading, () => {
            if (c.notFound) {
                this.contacts.remove(c);
            } else {
                for (const contact of this.contacts) {
                    if (contact.username === c.username && contact !== c) {
                        this.contacts.remove(contact);
                    }
                }
            }
        });
        return c;
    }

    // todo map
    _findInCache(username) {
        for (const contact of this.contacts) {
            if (contact.username === username) return contact;
        }
        return null;
    }

    // /**
    //  * Deletes contacts that were not found on server from store.
    //  */
    // @action removeInvalidContacts() {
    //     for (const c of this.contacts) {
    //         if (c.notFound) this.contacts.remove(c);
    //     }
    // }
}

const store = new ContactStore();
setContactStore(store);
module.exports = store;
