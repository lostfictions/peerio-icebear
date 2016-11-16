const { observable, action, computed, asFlat } = require('mobx');
const Chat = require('./chat');
const socket = require('../network/socket');
const normalize = require('../errors').normalize;
const User = require('./user');
const updateTracker = require('./update-tracker');
const File = require('./file');

class FileStore {
    @observable files = asFlat([]);
    @observable loading = false;
    loaded = false;
    _getFiles(min) {
        socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion: min || 0,
            query: { type: 'message' }
        });
    }

    loadAllFiles() {
        if (this.loading || this.loaded) return;
        this.getFiles.then(action(kegs => {
            for (const keg of kegs) {
                const file = new File(User.current.kegdb);
                file.loadFromKeg(keg);
                this.files.push(file);
            }
            this.loading = false;
            this.loaded = true;
        }));
    }


}

module.exports = new FileStore();
