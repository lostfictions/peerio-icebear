/**
 * Keg database module
 */
const ChatBootKeg = require('./boot-keg');
const socket = require('../../network/socket');
const keys = require('../../crypto/keys');
const User = require('../user');

class ChatKegDb {

    /**
     * Retrieves a chat keg database for participants,
     * creates a new one first if it didn't exist.
     * @param {Array<{username: publicKey}>} participants
     */
    static getChatKegDb = function(participants) {
        socket.send('/auth/kegs/collection/create-chat', { participants: participants.map(p => p.username) })
            .then(meta => {
                const db = new ChatKegDb(meta.id);
                return meta.collectionVersions.system ? db.loadBootKeg() : db.createBootKeg(participants);
            });
    };
    /**
     * Creates new database instance
     * @param {string} id - 'SELF' for own database, or specific id for shared databases
     */
    constructor(id) {
        if (!id) throw new Error('KegDb id is required to create instance.');
        this.id = id;
        this.kegs = {};
        this.createBootKeg = this.createBootKeg.bind(this);
        this.loadBootKeg = this.loadBootKeg.bind(this);
    }

    /**
     * Create boot keg for this database
     * @param {Object} participants
     */
    createBootKeg(participants) {
        console.log('Creating chat boot keg.');
        // keg key for this db
        const kegKey = keys.generateEncryptionKey();
        // ephemeral keypair to encrypt kegKey for participants
        const ephemeral = keys.generateEncryptionKeyPair();
        const boot = new ChatBootKeg(this, User.current.username, User.current.encryptionKeys, ephemeral);
        boot.data = {
            kegKey,
            participants
        };
        // keg key for this db
        this.key = kegKey;
        return boot.update().then(() => {
            this.kegs.boot = boot;
        }).return(this);
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    loadBootKeg() {
        console.log('Loading chat boot keg.');
        const boot = new ChatBootKeg(this, User.current.username, User.current.encryptionKeys);
        return boot.load().then(() => {
            this.kegs.boot = boot;
            this.key = boot.data.kegKey;
        }).return(this);
    }
}

module.exports = ChatKegDb;
