/**
 * Keg database module
 */
const ChatBootKeg = require('./chat-boot-keg');
const socket = require('../../network/socket');
const User = require('../user');
const contactStore = require('../stores/contact-store');
const _ = require('lodash');

class ChatKegDb {
    /**
     * Creates new database instance.
     * At least one of 2 parameters should be passed
     * @param {[string]} id - or specific id for shared databases
     * @param {[Array<Contact>]} participants - participants list, EXCLUDING own username
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
        // loading meta by id
        if (this.id) {
            return socket.send('/auth/kegs/collection/meta', { collectionId: this.id })
                         .then(this._fillFromMeta);
        }
        // loading meta by participants list
        this.participants = this.participants || [];
        // duplicate absence should be handled level higher but just to be safe.
        const arg = { participants: _.uniq(this.participants.map(p => p.username)) };
        // participants should not include currentDict user, but just to be safe.
        if (arg.participants.indexOf(User.current.username) < 0) {
            arg.participants.push(User.current.username);
        }
        return socket.send('/auth/kegs/collection/create-chat', arg)
                     .then(this._fillFromMeta);
    }


    _fillFromMeta(meta) {
        this.id = meta.id;
        // A little explanation on contactStore.getContact here
        // Yes, it is reactive and does not return promise.
        // And might not be done by the time next lines of code execute.
        // But there are 2 cases why are we here
        // 1 - we are creating a new chat, so all this contacts are already in cache
        // 2 - we are loading existing chat, so we don't really care about those contact details being loaded here
        this.participants = Object.keys(meta.permissions.users)
                                  .filter(username => username !== User.current.username)
                                  .map(username => contactStore.getContact(username));
        // todo: compare server version of participants with bootkeg?
        // todo: can't really find a reason to except to catch bugs
        return meta.collectionVersions.system ? this._loadBootKeg() : this._createBootKeg();
    }

    /**
     * Create boot keg for this database
     */
    _createBootKeg() {
        console.log(`Creating chat boot keg for ${this.id}`);
        const publicKeys = {};
        // other users
        this.participants.forEach(p => {
            // yes, we assume user can't proceed to creating chat without loading contact keys first
            // which is a fair assumption atm
            publicKeys[p.username] = p.encryptionPublicKey;
        });
        // ourselves
        publicKeys[User.current.username] = User.current.encryptionKeys.publicKey;
        // keg key for this db
        const boot = new ChatBootKeg(this, User.current, publicKeys);
        // saving bootkeg
        return boot.saveToServer()
                   .then(() => {
                       this.boot = boot;
                       // keg key for this db
                       this.key = boot.kegKey;
                       return this;
                   });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    _loadBootKeg() {
       // console.log(`Loading chat boot keg for ${this.id}`);
        const boot = new ChatBootKeg(this, User.current);
        return boot.load().then(() => {
            this.boot = boot;
            this.key = boot.kegKey;
            return this;
        });
    }
}

module.exports = ChatKegDb;
