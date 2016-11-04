const socket = require('../network/socket');
const { observable, action } = require('mobx');

class Contact {
    @observable loading = false;
    @observable notFound = false;
    @observable firstName = '';
    @observable lastName = '';
    @observable encryptionPublicKey = '';
    @observable signingPublicKey = '';

    constructor(username) {
        this.username = username;
    }

    load() {
        this.loading = true;
        return socket.send('/auth/lookupUser', { string: this.username })
                .then(action(resp => {
                        // currently there are old users in the system that don't have encryption public keys
                    if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                        throw new Error('Contact not found');
                    }
                    const profile = resp[0].profile;

                    this.encryptionPublicKey = new Uint8Array(profile.encryptionPublicKey);
                    this.signingPublicKey = new Uint8Array(profile.signingPublicKey);
                    this.firstName = profile.firstName || '';
                    this.lastName = profile.lastName || '';
                    this.notFound = false;
                    this.loading = false;
                    return this;
                })).catch(err => {
                    console.error(err);
                    this.notFound = true;
                    this.loading = false;
                    return this;
                });
    }
}

module.exports = Contact;
