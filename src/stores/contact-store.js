const { observable, action } = require('mobx');
const Contact = require('../models/contact');

// Contact objects
const contacts = observable([]);

function getContact(username) {
    const existing = findByUsername(username);
    if (existing) return existing;

    const c = new Contact(username);
    contacts.push(c);
    c.load();
    return c;
}

function findByUsername(username) {
    for (const contact of contacts) {
        if (contact.username === username) return contact;
    }
    return null;
}

const removeInvalidContacts = action(() => {
    for (const c of contacts) {
        if (c.notFound) contacts.remove(c);
    }
});

module.exports = { contacts, getContact, removeInvalidContacts };
