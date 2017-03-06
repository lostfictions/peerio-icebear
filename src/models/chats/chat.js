const { observable, computed, action, when } = require('mobx');
const Message = require('./message');
const ChatKegDb = require('../kegs/chat-keg-db');
const normalize = require('../../errors').normalize;
const User = require('../user');
const tracker = require('../update-tracker');
const socket = require('../../network/socket');
const Receipt = require('./receipt');
const _ = require('lodash');
const chatFiles = require('./chat.files');
const ChatUpdater = require('./chat.updater');
const chatPager = require('./chat.pager');
// to assign when sending a message and don't have an id yet
let temporaryChatId = 0;
function getTemporaryChatId() {
    return `creating_chat:${temporaryChatId++}`;
}

class Chat {

    @observable id = null;

    // Message objects
    @observable messages = observable.shallowArray([]);
    // performance helper, to lookup messages by id and avoid duplicates
    msgMap = {};

    /** @type {Array<Contact>} */
    @observable participants = null;

    // initial metadata loading
    @observable loadingMeta = false;
    metaLoaded = false;

    // initial messages loading
    @observable loadingPage = false;
    messagesLoaded = false;
    @observable updatingMessages = false;

    // currently selected/focused in UI
    @observable active = false;

    // list of files being uploaded to this chat
    @observable uploadQueue = observable.shallowArray([]);

    @observable unreadCount = 0;
    @observable downloadedUpdateId = 0;
    @observable maxUpdateId = 0;

    downloadedReceiptId = 0;
    // receipts cache {username: position}
    receipts = {};
    updater;

    @computed get participantUsernames() {
        if (!this.participants) return null;
        return this.participants.map(p => p.username);
    }

    @computed get chatName() {
        if (!this.participants) return '';
        return this.participants.length === 0
            ? User.current.username
            : this.participants.map(p => p.username).join(', ');
    }

    /**
     * @param {string} id - chat id
     * @param {Array<Contact>} participants - chat participants
     * @param {ChatStore} store
     * @summary at least one of two arguments should be set
     */
    constructor(id, participants, store) {
        this.id = id;
        this.store = store;
        if (!id) this.tempId = getTemporaryChatId();
        this.participants = participants;
        this.db = new ChatKegDb(id, participants);
    }

    loadMetadata() {
        if (this.metaLoaded || this.loadingMeta) return Promise.resolve();
        this.loadingMeta = true;
        return this.db.loadMeta()
            .then(action(() => {
                this.id = this.db.id;
                this.participants = this.db.participants;// todo computed
                this.loadingMeta = false;
                this.metaLoaded = true;
                this.updater = new ChatUpdater(this);
                // tracker.onKegTypeUpdated(this.id, 'receipt', this.onReceiptDigestUpdate);
                // this.onReceiptDigestUpdate();
            }))
            .catch(err => {
                console.error(normalize(err, 'Error loading chat keg db metadata.'));
                this.loadingMeta = false;
            });
    }

    @action addMessages(kegs, prepend = false) {
        if (!kegs || !kegs.length) return;
        for (let i = 0; i < kegs.length; i++) { // todo: check order, maybe iterate from last to first
            const keg = kegs[i];
            if (keg.deleted || this.msgMap[keg.kegId]) continue; // todo: update data of existing one?

            const msg = new Message(this.db).loadFromKeg(keg);
            // no payload for some reason. probably because of connection break after keg creation
            if (msg.isEmpty) continue;
            if (prepend) {
                this.messages.unshift(msg);
            } else {
                this.messages.push(msg);
            }
            // id is not there for
            if (msg.id) this.msgMap[msg.id] = msg;
        }
        this.sortMessages();
        // todo: post processing / calculations
        // todo: remove message excess
    }

    // sorts messages in-place
    // we use insertion sorting because it's optimal for our mostly always sorted small array
    sortMessages() {
        const array = this.messages;
        for (let i = 1; i < array.length; i++) {
            const item = array[i];
            let indexHole = i;
            while (indexHole > 0 && Chat.compareMessages(array[indexHole - 1], item) > 0) {
                array[indexHole] = array[--indexHole];
            }
            array[indexHole] = item;
        }
    }

    static compareMessages(a, b) {
        if (+a.id > +b.id) {
            return 1;
        }
        // commented out because current sort function only cares about a>b or not
        // if (+a.id < +b.id) {
        //     return -1;
        // }
        return -1;
    }

    removeMessages(count, fromTop = false) {
        if (!count) return;
        this.messages.splice(fromTop ? count : -count);
        // todo: post process ?
    }

    sendMessage(text, files) {
        const m = new Message(this.db);
        m.files = files;
        const promise = m.send(text);
        when(() => !!m.id, () => {
            if (!this.msgMap[m.id]) {
                // message wasn't added to map yet, so we are sure there's just one copy in the array
                this.msgMap[m.id] = m;
            } else if (this.msgMap[m.id] !== m) {
                // ups, it might have already been added via update process, we need to remove self
                this.messages.remove(m);
            }
            m.tempId = null;
        });
        // this._detectFirstOfTheDayFlag(m);
        this.messages.push(m);
        return promise.then(() => {
            this.downloadedUpdateId = Math.max(this.downloadedUpdateId, m.collectionVersion);
          //  this._sendReceipt(m.id);
        });
    }

    sendAck() {
        // !! IN CASE YOUR EDITOR SHOWS THE STRING BELOW AS WHITESPACE !!
        // Know that it's not a whitespace, it's unicode :thumb_up: emoji
        return this.sendMessage('👍');
    }

    /**
     * Checks if this chat's participants are the same one that are passed
     * @param participants
     */
    hasSameParticipants(participants) {
        if (this.participants.length !== participants.length) return false;

        for (const p of participants) {
            if (!this.participants.includes(p)) return false;
        }
        return true;
    }


    uploadAndShareFile(path, name) {
        return chatFiles.uploadAndShare(this, path, name);
    }

    shareFiles(files) {
        return chatFiles.share(this, files);
    }

    loadMessages() {
        if (!this.metaLoaded) {
            this.loadMetadata().then(() => this.loadMessages());
        }
        chatPager.getInitialPage(this);
    }

}

module.exports = Chat;
