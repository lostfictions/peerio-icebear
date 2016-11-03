const socket = require('../network/socket');

class Contact {

    constructor(username) {
        this.username = username;
        this.found = null; // true - contact data was filled from server,
                           // false - not found
                           // null - not requested yet
        this.load = this.load.bind(this);
    }

    load() {
        return socket.send('/auth/lookupUser', { string: this.username })
            .then(resp => {
                if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                    this.found = false;
                    return Promise.resolve(this);
                }
                this.encryptionPublicKey = new Uint8Array(resp[0].profile.encryptionPublicKey);
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