
const { observable, when, action, computed, intercept, isObservableArray } = require('mobx');
const socket = require('../../network/socket');
const Contact = require('./contact');
const { setContactStore } = require('../../helpers/di-contact-store');
const MyContacts = require('../contacts/my-contacts');
const Invites = require('../contacts/invites');
const warnings = require('../warnings');
const createMap = require('../../helpers/dynamic-array-map');
const { getFirstLetterUpperCase } = require('./../../helpers/string');

/**
 * Contact(Peerio user) information store.
 * Currently provides access to any public profiles and caches lookups.
 */
class ContactStore {
    /** @type {Array<Contact>} - This is a source of all contacts (except invited, non-peerio users) */
    @observable.shallow contacts = [];
    myContacts;
    invites;
    _requestMap = {};

    @computed get addedContacts() {
        return this.contacts.filter(c => c.isAdded);
    }

    @observable.shallow invitedContacts = [];

    // options: firstName, lastName, username
    @observable uiViewSortBy = 'firstName';
    // options: added, all
    @observable uiViewFilter = 'added';
    @observable uiViewSearchQuery = '';

    _checkSortValue(change) {
        switch (change.newValue) {
            case 'firstName':
            case 'lastName':
            case 'username':
                return change;
            default:
                console.error('Invalid contact sorting property:', change.newValue);
                return null;
        }
    }

    _checkFilterValue(change) {
        switch (change.newValue) {
            case 'added':
            case 'all':
                return change;
            default:
                console.error('Invalid contact filter property:', change.newValue);
                return null;
        }
    }


    @computed get uiView() {
        let ret;
        switch (this.uiViewFilter) {
            case 'all':
                ret = this.contacts;
                break;
            case 'added':
                ret = this.addedContacts;
                break;
            default: ret = [];
        }
        if (this.uiViewSearchQuery) {
            ret = this.filter(this.uiViewSearchQuery, ret, true);
        }
        ret = ret.sort((c1, c2) => {
            const val1 = c1[this.uiViewSortBy] || '', val2 = c2[this.uiViewSortBy] || '';
            return val1.localeCompare(val2);
        });
        ret = this.segmentizeByFirstLetter(ret, this.uiViewSortBy);
        return ret;
    }

    segmentizeByFirstLetter(array, property) {
        const ret = [];
        if (!array.length) return ret;
        const itemsByLetter = {}; // to easily group items by letter
        const letterOrder = []; // to have the right order of letters
        for (let i = 0; i < array.length; i++) {
            const letter = getFirstLetterUpperCase(array[i][property]);
            let letterArray = itemsByLetter[letter];
            if (!letterArray) {
                letterArray = itemsByLetter[letter] = [];
                letterOrder.push(letter);
            }
            letterArray.push(array[i]);
        }
        for (let i = 0; i < letterOrder.length; i++) {
            const letter = letterOrder[i];
            ret.push({ letter, items: itemsByLetter[letter] });
        }
        return ret;
    }

    constructor() {
        intercept(this, 'uiViewSortBy', this._checkSortValue);
        intercept(this, 'uiViewFilter', this._checkFilterValue);
        this._contactMap = createMap(this.contacts, 'username');
        socket.onceAuthenticated(() => {
            this.loadContactsFromTOFUKegs();
            this.myContacts = new MyContacts();
            this.myContacts.onUpdated = this.applyMyContactsData;
            this.invites = new Invites();
            this.invites.onUpdated = this.applyInvitesData;
        });
    }

    applyMyContactsData = action(() => {
        Object.keys(this.myContacts.contacts).forEach(username => {
            this.getContact(username);
        });
        this.contacts.forEach(c => {
            c.isAdded = !!this.myContacts.contacts[c.username];
        });
    });

    applyInvitesData = action(() => {
        this.invitedContacts = this.invites.issued;
        when(() => this.invites.loaded, () => {
            Promise.each(this.invitedContacts, c => {
                if (c.username) {
                    return this.addContact(c.username)
                        .then(() => this.removeInvite(c.email));
                }
                return null;
            }).then(() => {
                return Promise.each(this.invites.received, username => {
                    return this.addContact(username)
                        .then(() => this.removeReceivedInvite(username));
                });
            });
        });
    });

    /**
     *
     * @param {string|Contact} val - username, email or Contact
     * @returns {Promise<bool>} - true: added, false: not found
     */
    addContact(val) {
        const c = typeof val === 'string' ? this.getContact(val) : val;
        if (this.myContacts.contacts[c.username]) return Promise.resolve(true);
        return new Promise((resolve, reject) => {
            when(() => !c.loading, () => {
                if (c.notFound) {
                    resolve(false);
                } else {
                    this.myContacts.save(
                        () => this.myContacts.addContact(c),
                        () => this.myContacts.removeContact(c),
                        'error_contactAddFail'
                    ).then(() => {
                        // because own keg writes don't trigger digest update
                        this.applyMyContactsData();
                        warnings.add('snackbar_contactAdded');
                        resolve(true);
                    }).catch(reject);
                }
            });
        });
    }

    /**
     * Accepts array of preloaded contacts, doesn't not wait for passed contacts to load
     * @param {Array<Contact>} contacts
     * @returns
     * @memberof ContactStore
     */
    addContactBatch(contacts) {
        return this.myContacts.save(
            () => {
                contacts.forEach(c => this.myContacts.addContact(c));
                return true;
            },
            () => contacts.forEach(c => this.myContacts.removeContact(c))
        );
    }

    /**
     * Looks up by email and adds contacts to favorites list.
     * @param {Array<string>} emails
     * @returns {imported:Array<string>, notFound: Array<string>}
     * @memberof ContactStore
     */
    importContacts(emails) {
        if (!Array.isArray(emails) && !isObservableArray(emails)) {
            return Promise.reject(new Error(`importContact(emails) argument should be an Array<string>`));
        }
        return new Promise((resolve, reject) => {
            const ret = { imported: [], notFound: [] };
            let pos = 0;
            const step = () => {
                this._getBatchPage(emails, pos)
                    .then(res => {
                        if (!res.length) {
                            resolve(ret);
                            return null;
                        }
                        const toAdd = [];
                        for (let i = 0; i < res.length; i++) {
                            const item = res[i];
                            if (!item || !item.length) {
                                ret.notFound.push(emails[pos + i]);
                                continue;
                            }
                            const c = this.getContact(item[0].profile.username, [item]);
                            toAdd.push(c);
                        }
                        pos += res.length;
                        return this.addContactBatch(toAdd).then(() => {
                            this.applyMyContactsData();
                            ret.imported.push(...toAdd.map(c => c.username));
                            step();
                        });
                    })
                    .catch(() => reject(ret));
            };
            step();
        });
    }

    _getBatchPage(emails, pos) {
        if (pos >= emails.length) return Promise.resolve([]);
        return socket.send('/auth/user/lookup', { string: emails.slice(pos, pos + 15) });
    }

    removeContact(usernameOrContact) {
        const c = typeof usernameOrContact === 'string' ? this.getContact(usernameOrContact) : usernameOrContact;
        if (!this.myContacts.contacts[c.username]) return;
        when(() => !c.loading, () => {
            if (c.notFound) {
                warnings.add('error_contactRemoveFail');
            } else {
                this.myContacts.save(
                    () => this.myContacts.removeContact(c),
                    () => this.myContacts.addContact(c),
                    'error_contactRemoveFail'
                ).then(() => {
                    // because own keg writes don't trigger digest update
                    this.applyMyContactsData();
                    warnings.add('snackbar_contactRemoved');
                });
            }
        });
    }

    removeInvite(email) {
        return socket.send('/auth/contacts/issued-invites/remove', { email });
    }

    removeReceivedInvite(username) {
        socket.send('/auth/contacts/received-invites/remove', { username });
    }

    /**
     * Returns Contact object ether from cache or server.
     * Reactive.
     * @param {string} username
     * @returns {Contact}
     */
    getContact(username, prefetchedData) {
        let existing = this._contactMap[username];
        if (existing) return existing;
        existing = this._requestMap[username];
        if (existing) return existing;

        const c = new Contact(username, prefetchedData);
        this._requestMap[username] = c;

        when(() => !c.loading, () => {
            delete this._requestMap[username];
            if (!c.notFound && !this._contactMap[username]) {
                this.contacts.unshift(c);
                c.isAdded = !!this.myContacts.contacts[c.username];
            }
        });
        return c;
    }

    invite(email) {
        return socket.send('/auth/contacts/invite', { email })
            .then(() => {
                warnings.add('snackbar_emailInviteSent');
            })
            .catch(() => {
                warnings.add('error_emailInviteSend');
            });
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
    filter(token, list, nosort = false) {
        token = token.toLocaleLowerCase(); // eslint-disable-line
        let removeUnavailable = false;
        if (!list) {
            list = this.contacts; // eslint-disable-line
            removeUnavailable = true;
        }
        const ret = list
            .filter((c) => {
                if (removeUnavailable) {
                    if (c.loading || c.notFound) return false;
                }
                return c.username.includes(token) || c.fullNameLower.includes(token);
            });
        if (nosort) return ret;
        return ret.sort((c1, c2) => {
            if (c1.isAdded && !c2.isAdded) return -1;
            if (c2.isAdded && !c1.isAdded) return 1;
            if (token) {
                if (c1.username.startsWith(token)) return -1;
                if (c2.username.startsWith(token)) return 1;
                if (c1.fullNameLower.startsWith(token)) return -1;
                if (c2.fullNameLower.startsWith(token)) return 1;
            }
            return c1.username.localeCompare(c2.username);
        });
    }
}

const store = new ContactStore();
setContactStore(store);
module.exports = store;
