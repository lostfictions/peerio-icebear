const usernames = ['eric', 'kenny', 'kyle', 'stan', 'butters', 'wendy', 'bebe', 'mrhankey', 'timmy', 'jimmy'];
let usernamePos = 0;

function nextUsername() {
    const ret = usernames[usernamePos++];
    if (usernamePos === usernames.length) usernamePos = 0;
    return ret;
}

function createFakeContact() {
    const Contact = require('../../src/models/contact');
    const contact = new Contact(nextUsername(), true);
    contact.loading = false;
    return contact;
}

module.exports = createFakeContact;
