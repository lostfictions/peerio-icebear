const socket = require('../network/socket');
const { observable, action, reaction, when } = require('mobx');
const util = require('../crypto/util');
const { getUser } = require('./../helpers/current-user');

/**
 * Possible states and how to read them:
 * loading === true - trying to load contact, will make many attempts in case of connection issues
 * loading === false && notFound === false - success
 * loading === false && notFound === true  - fail due to inexisting contact
 */

class Contact {
    // this flag means that we are making attempts to load contact
    // once it's 'false' it means that we are done trying with ether positive (notFound=false) result
    // or negative result.
    @observable loading = true; // default state, bcs that's what we do from the moment contact is created
    @observable firstName = '';
    @observable lastName = '';
    @observable encryptionPublicKey = '';
    @observable signingPublicKey = '';
    @observable color = '';

    // contact wasn't found on server
    notFound = false;
    // to avoid parallel queries
    _waitingForResponse = false;

    constructor(username) {
        this.username = username;
        if (getUser().username === username) this.isMe = true;
        reaction(() => this.encryptionPublicKey, () => {
            this.color = `#${this.signingPublicKey ? util.getHexHash(3, this.signingPublicKey) : '9e9e9e'}`;
        });
        this.load();
    }

    load() {
        if (!this.loading || this._waitingForResponse) return;
        console.log(`Loading contact: ${this.username}`);
        this.loading = true;
        this._waitingForResponse = true;
        socket.send('/auth/lookupUser', { string: this.username })
              .then(action(resp => {
                  this._waitingForResponse = false;
                  this.loading = false;
                  // currently there are old users in the system that don't have encryption public keys
                  if (!resp || !resp.length || !resp[0].profile.encryptionPublicKey) {
                      this.notFound = true;
                      return;
                  }
                  const profile = resp[0].profile;
                  this.username = profile.username;
                  this.firstName = profile.firstName || '';
                  this.lastName = profile.lastName || '';
                  // this is server - controlled data, so we don't account for cases when it's invalid
                  this.encryptionPublicKey = new Uint8Array(profile.encryptionPublicKey);
                  this.signingPublicKey = new Uint8Array(profile.signingPublicKey);
              }))
              .catch(err => {
                  this._waitingForResponse = false;
                  socket.onceAuthenticated(() => this.load());
                  console.log(err);
              });
    }

    whenLoaded(callback) {
        // it is important for this to be async
        when(() => !this.loading, () => callback(this));
    }
}

module.exports = Contact;
