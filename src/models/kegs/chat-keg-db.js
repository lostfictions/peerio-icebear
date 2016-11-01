/**
 * Keg database module
 */
const ChatBootKeg = require('./boot-keg');
const socket = require('../../network/socket');
const keys = require('../../crypto/keys');
const User = require('../user');
const Contact = require('../contact');

class ChatKegDb {
    /**
     * Creates new database instance.
     * At least one of 2 parameters should be passed
     * @param {[string]} id - or specific id for shared databases
     * @param {[Array<string>]} participants - participants list, including own username
     */
    constructor(id, participants) {
        this.id = id;
        this.participants = participants;
        this.kegs = {};
        this._createBootKeg = this._createBootKeg.bind(this);
        this._loadBootKeg = this._loadBootKeg.bind(this);
        this._fillFromMeta = this._fillFromMeta.bind(this);
    }

    /**
     * Performs initial load of the keg database data based on id or participants list.
     * Will create kegdb and bootkeg if needed.
     * @returns {Promise}
     */
    load() {
        if (this.id) {
            return socket.send('/auth/kegs/collection/meta', { collectionId: this.id })
                        .then(this._fillFromMeta);
        }

        if (!this.participants || !this.participants.length) {
            return Promise.reject(new Error('Id or participants are required to load char keg db.'));
        }

        return socket.send('/auth/kegs/collection/create-chat', { participants: this.participants })
                       .then(this._fillFromMeta);
    }

    _fillFromMeta(meta) {
        this.id = meta.id;
        this.participants = Object.keys(meta.users.permissions);
        return meta.collectionVersions.system ? this.loadBootKeg() : this.createBootKeg();
    }

    /**
     * Create boot keg for this database
     */
    _createBootKeg() {
        console.log('Creating chat boot keg.');
        console.log('Looking up public keys.');
        const publicKeys = {};
        const promises = [];

        this.participants.forEach(u => {
            promises.push(new Contact(u).load().then(c => {
                publicKeys[u] = c.encryptionPublicKey;
            }));
        });

        Promise.all(promises).then(() => {
            // keg key for this db
            const kegKey = keys.generateEncryptionKey();
            // ephemeral keypair to encrypt kegKey for participants
            const ephemeral = keys.generateEncryptionKeyPair();
            const boot = new ChatBootKeg(this, User.current.username, User.current.encryptionKeys, ephemeral);
            boot.data = {
                kegKey,
                participants: publicKeys
            };
            // keg key for this db
            this.key = kegKey;
            return boot.update().then(() => {
                this.kegs.boot = boot;
            }).return(this);
        });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    _loadBootKeg() {
        console.log('Loading chat boot keg.');
        const boot = new ChatBootKeg(this, User.current.username, User.current.encryptionKeys);
        return boot.load().then(() => {
            this.kegs.boot = boot;
            this.key = boot.data.kegKey;
        }).return(this);
    }
}

module.exports = ChatKegDb;
