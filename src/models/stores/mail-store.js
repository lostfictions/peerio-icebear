const _ = require('lodash');
const { observable, action, computed } = require('mobx');
const socket = require('../../network/socket');
const Ghost = require('../ghost');
const User = require('../user');
const tracker = require('../update-tracker');
const systemWarnings = require('../system-warning');

class MailStore {
    @observable ghosts = observable.shallowArray([]); // sorted array
    @observable ghostMap = observable.shallowMap({});
    @observable loading = false;
    @observable loaded = false;
    @observable updating = false;
    @observable selectedId = null; // ghostId

    @computed get selectedGhost() {
        return this.ghostMap.get(this.selectedId);
    }

    constructor() {
        this.updateGhosts = this.updateGhosts.bind(this);
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
        if (minCollectionVersion === 0) query.deleted = false;
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
            console.log('there are mail kegs', kegs.length);
            for (const keg of kegs) {
                const ghost = new Ghost(User.current.kegDb);
                this.knownCollectionVersion = Math.max(this.knownCollectionVersion, keg.collectionVersion);
                if (ghost.loadFromKeg(keg)) {
                    console.log('loading ghost', ghost.ghostId);
                    this.ghostMap.set(ghost.ghostId, ghost);
                }
            }
            this.sortByDate();
            this.loading = false;
            this.loaded = true;
            tracker.onKegTypeUpdated('SELF', 'ghost', this.updateGhosts);
        }));
    }

    /**
     * Update when server sends an update to the collection.
     * @returns {Promise}
     */
    updateGhosts() {
        console.log('coll updated');
        if (this.updating || this.loading) return;
        this.updating = true;
        this._getGhosts()
            .then(action((kegs) => {
                for (const keg of kegs) {
                    const inCollection = this.getById(keg.props.ghostId);
                    console.log('in collection?', inCollection);
                    const g = inCollection || new Ghost(User.current.kegDb);
                    this.knownCollectionVersion = Math.max(this.knownCollectionVersion, keg.collectionVersion);
                    if (keg.isEmpty || !g.loadFromKeg(keg)) continue;
                    if (!g.deleted && !inCollection) this.ghostMap.set(g.ghostId, g);
                    if (g.deleted && inCollection) delete this.ghostMap.delete(keg.ghostId);
                }
                console.log('ghost map', this.ghostMap);
                this.sortByDate(); // FIXME will draft die if receiving update?
                this.updating = false;
            }));
    }

    /**
     * Create a new ghost.
     *
     * @returns {*}
     */
    createGhost() {
        const g = new Ghost();
        this.ghostMap.set(g.ghostId, g);
        this.ghosts.unshift(g);
        this.selectedId = g.ghostId;
        // FIXME is it added to colleciton when saved?
        return g;
    }

    /**
     * Send a new ghost
     */
    send(g, text) {
        return g.send(text)
            .catch(e => {
                // TODO: global error handling
                systemWarnings.addLocalWarningSevere(
                    'ghosts_quotaExceeded', 'ghosts_sendingError', ['upgrade', 'ok']);
            })
            .finally(() => g.sendError && this.remove(g));
    }

    /**
     * Just remove from kegs.
     *
     * @param {Ghost} ghost
     */
    remove(g) {
        // if the ghost weren't successfully saved to server (quota exceeded)
        if (!g.id) {
            this.ghostMap.delete(g.ghostId);
            const i = this.ghosts.indexOf(g);
            (i !== -1) && this.ghosts.splice(i, 1);
            return Promise.resolve();
        }
        return g.remove();
    }

    /**
     *
     * @param ghostId
     * @returns {*}
     */
    getById(ghostId) {
        return this.ghostMap.get(ghostId);
    }

    /**
     *
     */
    sortByDate() {
        this.ghosts = _.sortBy(this.ghostMap.toJS(), (g) => -g.timestamp);
        if (this.ghosts.length === 0) return;
        console.log('most recent is', this.ghosts[0]);
        this.selectedId = this.ghosts[0].ghostId;
    }

}

module.exports = new MailStore();
