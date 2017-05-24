/**
 * Keg database module
 */

const ChatBootKeg = require('./chat-boot-keg');
const socket = require('../../network/socket');
const User = require('../user/user');
const contactStore = require('../contacts/contact-store');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');
const Contact = require('../contacts/contact');

/**
 * Chat loading logic
 * retryUntilSuccess(
 * 1. Do we have ID for the chat?
 * - 1.1 NO:
 *      - create-chat
 *      - if resolved: now we have chat meta data, GOTO (2.)
 *      - if rejected: retry is triggered
 * - 1.2 YES:
 *      - get metadata
 *      - if resolved: now we have chat meta data, GOTO (2.)
 *      - if rejected: retry is triggered
 * 2. Parse chat metadata
 * 3. Does boot keg exist? (load it and check if keg version > 1)
 * - 3.1 YES:
 *      - load boot keg
 *      - resolved: is it valid ?
 *          - YES: FINISH. Promise.resolve(true)
 *          - NO: FINISH. Promise.resolve(false) for retry to not trigger
 *      - rejected: retry is triggered
 * - 3.2 NO:
 *      - create boot keg.
 *          - resolved: FINISH. Promise.resolve(true)
 *          - rejected: retry is triggered
 * - 3.3 load failed: retry is triggered
 * , 'Unique retry id')
 */

class ChatKegDb {

    // if true -  something is wrong with bootkeg, most likely it was maliciously created and can't be used
    dbIsBroken = false;
    /**
     * Creates new database instance.
     * At least one of 2 parameters should be passed
     * @param {[string]} id - or specific id for shared databases
     * @param {[Array<Contact>]} participants - participants list, EXCLUDING own username
     */
    constructor(id, participants) {
        this.id = id;
        this.participants = participants;
        // just to prevent parallel load routines, we can't use chat id bcs we don't always have it
        this._retryId = Math.random();
    }

    /**
     * Performs initial load of the keg database data based on id or participants list.
     * Will create kegDb and bootkeg if needed.
     * @returns {Promise}
     */
    loadMeta() {
        return retryUntilSuccess(() => {
            if (this.id) {
                return this._loadExistingChatMeta();
            }
            return this._createChatMeta();
        }, this._retryId);
    }

    _loadExistingChatMeta() {
        return socket.send('/auth/kegs/db/meta', { kegDbId: this.id })
            .then(this._parseMeta)
            .then(this._resolveBootKeg);
    }

    _createChatMeta() {
        // creating chat (or loading it by participant list in case we don't have chat id for some weird reason)
        this.participants = this.participants || [];
        // duplicate absence should be handled level higher but just to be safe.
        const arg = { participants: _.uniq(this.participants.map(p => p.username)) };
        // participants should not include current user, but just to be safe.
        if (arg.participants.indexOf(User.current.username) < 0) {
            arg.participants.push(User.current.username);
        }
        // server will return existing chat if it does already exist
        // the logic below takes care of rare collision cases, like when users create chat or boot keg at the same time
        return socket.send('/auth/kegs/db/create-chat', arg)
            .then(this._parseMeta)
            .then(this._resolveBootKeg);
    }


    // fills current object propertis from raw keg metadata
    _parseMeta = (meta) => {
        this.id = meta.id;
        this.participants = Object.keys(meta.permissions.users)
            .filter(username => username !== User.current.username)
            .map(username => contactStore.getContact(username));
    }

    // figures out if we need to load/create boot keg and does it
    _resolveBootKeg = () => {
        return this._loadBootKeg()
            .then(boot => {
                if (boot.version > 1) return [boot, false];
                return this._createBootKeg();
            })
            .spread((boot, justCreated) => {
                this.boot = boot;
                this.key = boot.kegKey;
                if (!this.key) this.dbIsBroken = true;
                return justCreated;
            })
            .tapCatch(err => console.error(err));
    }

    /**
     * Create boot keg for this database
     */
    _createBootKeg() {
        console.log(`Creating chat boot keg for ${this.id}`);
        const publicKeys = {};

        return Contact.ensureAllLoaded(this.participants)
            .then(() => {
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
                return boot.saveToServer().return([boot, true]);
            });
    }

    /**
     * Retrieves boot keg for the db and initializes this KegDb instance with required data.
     */
    _loadBootKeg() {
        // console.log(`Loading chat boot keg for ${this.id}`);
        const boot = new ChatBootKeg(this, User.current);
        return boot.load(true).return(boot);
    }
}

module.exports = ChatKegDb;
