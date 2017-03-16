const { observable, when } = require('mobx');
const socket = require('../../network/socket');
const Contact = require('./contact');
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

    _merge(usernames) {
        usernames.forEach(u => this.getContact(u));
    }

    loadLegacyContacts() {
        return socket.send('/auth/legacy/contacts/get')
            .then(list => {
                console.log(`contact-store.js: load legacy contacts`);
                // console.log(list);
                list && list.length && this._merge(list);
            });
    }
}

const store = new ContactStore();
setContactStore(store);
module.exports = store;
