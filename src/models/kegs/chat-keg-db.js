/**
 * Keg database module
 */
const ChatBootKeg = require('./chat-boot-keg');
const socket = require('../../network/socket');
const User = require('../user/user');
const contactStore = require('../contacts/contact-store');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');

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
        this._fillFromMeta = this._fillFromMeta.bind(this);
    }

    /**
     * Performs initial load of the keg database data based on id or participants list.
     * Will create kegDb and bootkeg if needed.
     * @returns {Promise}
     */
    loadMeta() {
        // this chat already exists, loading meta by id
        if (this.id) {
            return retryUntilSuccess(
                () => socket.send('/auth/kegs/collection/meta', { collectionId: this.id }).then(this._fillFromMeta),
                `load chat meta: ${this.id}`
            );
        }
        // creating chat (or loading it by participant list in case we don't have chat id for some weird reason)
        this.participants = this.participants || [];
        // duplicate absence should be handled level higher but just to be safe.
        const arg = { participants: _.uniq(this.participants.map(p => p.username)) };
        // participants should not include currentDict user, but just to be safe.
        if (arg.participants.indexOf(User.current.username) < 0) {
            arg.participants.push(User.current.username);
        }
        // server will return existing chat if it does already exist
        // the logic below takes care of rare collision cases, like when users create chat or boot keg at the same time
        return retryUntilSuccess(() => {
            return socket.send('/auth/kegs/collection/create-chat', arg)
                .then(this._fillFromMeta);
        }, `create chat for: ${arg.participants.join(',')}`);
    }


    _fillFromMeta(meta) {
        this.id = meta.id;
        // A little explanation on contactStore.getContact here
        // Yes, it is reactive and does not return promise.
        // And might not be done by the time next lines of code execute.
        // But there are 2 cases why are we here
        // 1 - we are creating a new chat, so all this contacts are already in cache (validator made them load)
        // 2 - we are loading existing chat, so we don't really care about those contact details being loaded here
        this.participants = Object.keys(meta.permissions.users)
            .filter(username => username !== User.current.username)
            .map(username => contactStore.getContact(username));
        // if there are no system kegs yet (version === 0) this means boot keg wasn't created yet
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
            // which is a fair assumption atm, see comments in '_fillFromMeta'
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
            })
            .tapCatch(err => console.error(err));
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
        }).tapCatch(err => console.error(err));
    }
}

module.exports = ChatKegDb;
