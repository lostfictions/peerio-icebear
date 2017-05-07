const tracker = require('../update-tracker');

class ChatWatchList {
    list = {};
    promoteHandler = null;
    // subscribes a function to 'chat promoted' event, meaning the chat is going from watch list to chat store
    onChatPromoted(fn) {
        this.promoteHandler = fn;
    }

    // adds a chat to watch list
    // chat will be immediatelly promoted if it has to
    add(id) {
        if (this.list[id]) return;
        const d = tracker.getDigest(id, 'message');
        if (d.maxUpdateId > d.knownUpdateId) {
            setTimeout(() => this.promoteHandler(id));
            return;
        }

        const handler = () => {
            const digest = tracker.getDigest(id, 'message');
            const watcher = this.list[id];
            if (digest.maxUpdateId > digest.knownUpdateId
                || (watcher && watcher.maxId < digest.maxUpdateId)) {
                setTimeout(() => this.promoteHandler(id));
            }
        };
        this.list[id] = { maxId: d.maxUpdateId, handler };
        tracker.onKegTypeUpdated(id, 'message', handler);
    }

    remove(id) {
        if (!this.list[id]) return;
        tracker.unsubscribe(this.list[id].handler);
        delete this.list[id];
    }
}

module.exports = ChatWatchList;
