const L = require('l.js');
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
                L.info(`contact-store.js: load legacy contacts`);
                // L.info(list);
                list && list.length && this._merge(list);
            });
    }

    loadContactsFromTOFUKegs() {
        socket.send('/auth/kegs/db/list-ext', {
            kegDbId: 'SELF',
            options: {
                type: 'tofu'
            }
        }).then(res => {
            if (!res.kegs || !res.kegs.length) return;
            res.kegs.forEach(keg => this.getContact(keg.props.username));
        });
    }
    /**
     * Filters contacts by username and First Last name based on passed token
     * @param {string} token - search query string
     * @param {Array<Contact>} list - optional list to search in, by default it will search in contact store
     */
    filter(token, list) {
        token = token.toLocaleLowerCase(); // eslint-disable-line
        let removeUnavailable = false;
        if (!list) {
            list = this.contacts; // eslint-disable-line
            removeUnavailable = true;
        }
        return list
            .filter((c) => {
                if (removeUnavailable) {
                    if (c.loading || c.notFound) return false;
                }
                return c.username.includes(token) || c.fullNameLower.includes(token);
            }).sort((c1, c2) => {
                if (c1.username.startsWith(token)) return -1;
                if (c2.username.startsWith(token)) return 1;
                if (c1.fullNameLower.startsWith(token)) return -1;
                if (c2.fullNameLower.startsWith(token)) return 1;
                return 0;
            });
    }
}

const store = new ContactStore();
socket.onceAuthenticated(() => {
    store.loadContactsFromTOFUKegs();
});
setContactStore(store);
module.exports = store;
