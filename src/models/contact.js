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
        this._load();
    }

    _load() {
        this.loading = true;
        socket.send('/auth/lookupUser', { string: this.username })
            .then(action(resp => {
                // currently there are old users in the system that don't have encryption public keys
                if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                    this.found = false;
                    return Promise.resolve(this);
                }
                const profile = resp[0].profile;

                this.encryptionPublicKey = new Uint8Array(profile.encryptionPublicKey);
                this.signingPublicKey = new Uint8Array(profile.signingPublicKey);
                this.firstName = profile.firstName || '';
                this.lastName = profile.lastName || '';
                return this;
            }))
            .catch(err => {
                console.error(err);
                this.notFound = true;
                return this;
            });
        return this;
    }
}

module.exports = Contact;
