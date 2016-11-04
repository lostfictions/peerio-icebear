const socket = require('../network/socket');
const { observable, action } = require('mobx');

class Contact {
    // if loading false - contact is done loading
    // usage: `when(()=>!contact.loading, ()=> side effect)
    @observable loading = false;
    @observable firstName = '';
    @observable lastName = '';
    @observable encryptionPublicKey = '';
    @observable signingPublicKey = '';

    notFound = false;

    constructor(username) {
        this.username = username;
        this.load();
    }

    load() {
        if (this.loading) return;
        console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        socket.send('/auth/lookupUser', { string: this.username })
              .then(action(resp => {
                  // currently there are old users in the system that don't have encryption public keys
                  if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                      throw new Error('Contact not found');
                  }
                  const profile = resp[0].profile;

                  this.firstName = profile.firstName || '';
                  this.lastName = profile.lastName || '';
                  this.encryptionPublicKey = new Uint8Array(profile.encryptionPublicKey);
                  this.signingPublicKey = new Uint8Array(profile.signingPublicKey);
                  this.notFound = false;
                  this.loading = false;
                  return this;
              }))
              .catch(err => {
                  console.error(err);
                  this.firstName = '';
                  this.lastName = '';
                  this.encryptionPublicKey = '';
                  this.signingPublicKey = '';
                  this.notFound = true;
                  this.loading = false;
                  return this;
              });
    }
}

module.exports = Contact;
