const _ = require('lodash');
const fs = require('fs');
const { observable, action, computed } = require('mobx');
const socket = require('../../network/socket');
const Ghost = require('../kegs/ghost');
const User = require('../user');
const tracker = require('../update-tracker');

class MailStore {
    @observable ghosts = observable.shallowArray([]);
    @observable loading = false;
    @observable loaded = false;
    @observable selectedId = null;

    @computed get selectedGhost() {
        return _.find(this.ghosts, { ghostId: this.selectedId });
    }

    constructor() {
        this.loadAllGhosts = this.loadAllGhosts.bind(this);
    }

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
                    this.ghosts.push(ghost);
                    console.log('loaded ghost', ghost.body);
                }
            }
            this.loading = false;
            this.loaded = true;
            tracker.onKegTypeUpdated('SELF', 'ghost', this.loadAllGhosts);
        })).then(() => {
            // TODO allow other kinds of sort
            _.sortBy(this.ghosts, (g) => -g.timestamp);
            this.selectedId = this.ghosts[0].ghostId;
        });
    }

    /**
     * Send a new ghost.
     *
     * @returns {*}
     */
    createGhost() {
        const g = new Ghost();

        this.ghosts.unshift(g);
        return g;

        // when(() => !g.sending, () => {
        //
        // });
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
