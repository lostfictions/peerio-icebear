const { observable, action } = require('mobx');
const Contact = require('../models/contact');


class ContactStore {
    @observable contacts = [];

    getContact(username) {
        const existing = this.findByUsername(username);
        if (existing) return existing;

        const c = new Contact(username);
        this.contacts.push(c);
        c.load();
        return c;
    }

    findByUsername(username) {
        for (const contact of this.contacts) {
            if (contact.username === username) return contact;
        }
        return null;
    }

    @action removeInvalidContacts() {
        for (const c of this.contacts) {
            if (c.notFound) this.contacts.remove(c);
        }
    }
}


module.exports = new ContactStore();
