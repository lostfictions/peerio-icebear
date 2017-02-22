const { observable, computed } = require('mobx');
const User = require('./user');


class ChatState {
    @observable id=null;

    // Message objects
    @observable messages = observable.shallowArray([]);
    // performance helper, to lookup messages by id and avoid duplicates
    _msgMap = {};

    /** @type {Array<Contact>} */
    @observable participants = null;

    // initial metadata loading
    @observable loadingMeta = false;
    metaLoaded = false;

    // initial messages loading
    @observable loadingMessages = false;
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
}

module.exports = ChatState;
