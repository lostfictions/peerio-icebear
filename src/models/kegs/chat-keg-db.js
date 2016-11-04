/**
 * Keg database module
 */
const ChatBootKeg = require('./chat-boot-keg');
const socket = require('../../network/socket');
const keys = require('../../crypto/keys');
const User = require('../user');
const MessageKeg = require('./message-keg');
const contactStore = require('../contact-store');

class ChatKegDb {
    /**
     * Creates new database instance.
     * At least one of 2 parameters should be passed
     * @param {[string]} id - or specific id for shared databases
     * @param {[Array<Contact>]} participants - participants list, including own username
     */
    constructor(id, participants) {
        this.id = id;
        this.participants = participants;
        this._createBootKeg = this._createBootKeg.bind(this);
        this._loadBootKeg = this._loadBootKeg.bind(this);
        this._fillFromMeta = this._fillFromMeta.bind(this);
    }

    /**
     * Performs initial load of the keg database data based on id or participants list.
     * Will create kegdb and bootkeg if needed.
     * @returns {Promise}
     */
    loadMeta() {
        if (this.id) {
            return socket.send('/auth/kegs/collection/meta', { collectionId: this.id })
                         .then(this._fillFromMeta);
        }

        if (!this.participants || !this.participants.length) {
            return Promise.reject(new Error('Id or participants are required to load char keg db.'));
        }

        return socket.send('/auth/kegs/collection/create-chat',
                           { participants: this.participants.map(p => p.username) })
                     .then(this._fillFromMeta);
    }

    /**
     * Returns entire list of message kegs in this database
     * @returns {Promise<Array<MessageKeg>>}
     */
    getAllMessages() {
        const ret = [];
        return socket.send('/auth/kegs/query', {
            collectionId: this.id,
            minCollectionVersion: 0,
            query: { type: 'message' }
        }).then(list => {
            for (const kegData of list) {
                // todo: handle invalid kegs, mark them and continue
                const keg = new MessageKeg(this);
                keg.loadFromExistingData(kegData);
                ret.push(keg);
            }
            return ret;
        });
    }

    _fillFromMeta(meta) {
        this.id = meta.id;
        this.participants = Object.keys(meta.permissions.users)
                                  .map(username => contactStore.getContact(username));

        return meta.collectionVersions.system ? this._loadBootKeg() : this._createBootKeg();
    }

    /**
     * Create boot keg for this database
     */
    _createBootKeg() {
        console.log('Creating chat boot keg.');
        const publicKeys = {};
        this.participants.forEach(p => {
            publicKeys[p.username] = p.encryptionPublicKey;
        });
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
        // saving bootkeg
        return boot.update()
                   .then(() => {
                       this.boot = boot;
                       return this;
                   });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    _loadBootKeg() {
        console.log('Loading chat boot keg.');
        const boot = new ChatBootKeg(this, User.current.username, User.current.encryptionKeys);
        return boot.load().then(() => {
            this.boot = boot;
            this.key = boot.data.kegKey;
            return this;
        });
    }
}

module.exports = ChatKegDb;
