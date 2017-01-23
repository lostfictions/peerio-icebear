const { observable, action, computed, asFlat } = require('mobx');
const socket = require('../../network/socket')();
const Ghost = require('../kegs/ghost');
const User = require('../user');
const tracker = require('../update-tracker');

class MailStore {
    @observable ghosts = asFlat([]);
    @observable loading = false;
    @observable loaded = false;

    /**
     * Fetch ghosts from the server.
     *
     * @param minCollectionVersion
     * @returns {Socket|*}
     * @private
     */
    _getGhosts(minCollectionVersion = 0) {
        const query = { type: 'ghost' };
        if (minCollectionVersion === 0) query.deleted = 'false';
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion,
            query
        });
    }

    /**
     * Load all ghosts.
     */
    loadAllGhosts() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        this._getGhosts().then(action(kegs => {
            for (const keg of kegs) {
                const ghost = new Ghost(User.current.kegdb);
                this.knownCollectionVersion = Math.max(this.knownCollectionVersion, keg.collectionVersion);
                if (ghost.loadFromKeg(keg)) {
                    this.ghosts.push(ghost)
                    ghost.sent = true;
                }
            }
            this.loading = false;
            this.loaded = true;
            tracker.onKegTypeUpdated('SELF', 'ghost', this.loadAllGhosts);
        }));
    }

    /**
     * Send a new ghost.
     *
     * @param {Array<String>} recipients
     * @param {String} text
     * @param {String} subjectww
     * @param {Array} files
     * @param {String} passphrase
     * @returns {*}
     */
    createGhost() {
        const g = new Ghost();
        this.ghosts.unshift(g);
        return g;

        //when(() => !g.sending, () => {
        //
        //});
    }

    /**
     * Just remove from kegs.
     *
     * @param {Ghost} ghost
     */
    remove(ghost) {
        return ghost.remove();
    }
}

module.exports = new MailStore();
