const socket = require('../network/socket');

class Contact {

    constructor(username) {
        this.username = username;
        this.found = null; // true - contact data was filled from server,
                           // false - not found
                           // null - not requested yet
    }

    load() {
        return socket.send('/auth/lookupUser', { string: this.username })
            .then(resp => {
                if (!resp || !resp.length || !resp[0].encryptionPublicKey) {
                    this.found = false;
                    return Promise.resolve(this);
                }
                this.encryptionPublicKey = resp[0].encryptionPublicKey;
                this.found = true;
                return this;
            })
            .catch(err => {
                console.error(err);
                this.found = false;
                return this;
            });
    }


}

module.exports = Contact;
