'use strict';

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

// @ts-check
const _ = require('lodash');
const { observable, action, computed } = require('mobx');
const socket = require('../../network/socket');
const Ghost = require('./ghost');
const User = require('../user/user');
const tracker = require('../update-tracker');
const warnings = require('../warnings');

let GhostStore = (_class = class GhostStore {
    // sorted array
    get selectedGhost() {
        return this.ghostMap.get(this.selectedId);
    } // ghostId
    // ghost by ghostId


    constructor() {
        _initDefineProp(this, 'ghosts', _descriptor, this);

        _initDefineProp(this, 'ghostMap', _descriptor2, this);

        _initDefineProp(this, 'loading', _descriptor3, this);

        _initDefineProp(this, 'loaded', _descriptor4, this);

        _initDefineProp(this, 'updating', _descriptor5, this);

        _initDefineProp(this, 'selectedId', _descriptor6, this);

        _initDefineProp(this, 'selectedSort', _descriptor7, this);

        this.updateGhosts = this.updateGhosts.bind(this);
        this.loadAllGhosts = this.loadAllGhosts.bind(this);
    }

    /*
     * Fetch ghosts from the server.
     *
     * @param minCollectionVersion
     * @returns {Socket|*}
     * @private
     */
    _getGhosts(minCollectionVersion = '') {
        const query = { type: 'ghost' };
        if (minCollectionVersion === '') query.deleted = false;
        return socket.send('/auth/kegs/query', { // TODO: SWITCH TO LIST-EXT API
            kegDbId: 'SELF',
            minCollectionVersion,
            query
        });
    }

    /*
     * Load all ghosts.
     */
    loadAllGhosts() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        this._getGhosts().then(action(kegs => {
            console.log('there are mail kegs', kegs.length);
            for (const keg of kegs) {
                const ghost = new Ghost(User.current.kegDb);
                if (keg.collectionVersion > this.knownCollectionVersion) {
                    this.knownCollectionVersion = keg.collectionVersion;
                }
                if (ghost.loadFromKeg(keg)) {
                    console.log('loading ghost', ghost.ghostId);
                    this.ghostMap.set(ghost.ghostId, ghost);
                }
            }
            this.sort(this.selectedSort);
            this.loading = false;
            this.loaded = true;
            tracker.onKegTypeUpdated('SELF', 'ghost', this.updateGhosts);
        }));
    }

    /*
     * Update when server sends an update to the collection.
     * @returns {Promise}
     */
    updateGhosts() {
        if (this.updating || this.loading) return;
        this.updating = true;
        this._getGhosts().then(action(kegs => {
            for (const keg of kegs) {
                const inCollection = this.getById(keg.props.ghostId);
                const g = inCollection || new Ghost(User.current.kegDb);
                if (keg.collectionVersion > this.knownCollectionVersion) {
                    this.knownCollectionVersion = keg.collectionVersion;
                }
                if (!g.loadFromKeg(keg) || g.isEmpty) continue;
                if (!g.deleted && !inCollection) this.ghostMap.set(g.ghostId, g);
                if (g.deleted && inCollection) this.ghostMap.delete(keg.ghostId);
            }
            this.sort(this.selectedSort);
            this.updating = false;
        }));
    }

    /*
     * Create a new ghost.
     *
     * @returns {*}
     */
    createGhost() {
        const g = new Ghost(User.current.kegDb);
        this.ghostMap.set(g.ghostId, g);
        this.ghosts.unshift(g);
        this.selectedId = g.ghostId;
        return g;
    }

    /*
     * Send a new ghost
     */
    send(g, text) {
        return g.send(text).catch(() => {
            // TODO: global error handling
            warnings.addSevere('error_mailQuotaExceeded', 'error_sendingMail');
        }).finally(() => g.sendError && this.remove(g));
    }

    /*
     * Just remove from kegs.
     *
     * @param {Ghost} ghost
     */
    remove(g) {
        // if the ghost weren't successfully saved to server (quota exceeded)
        if (!g.id) {
            this.ghostMap.delete(g.ghostId);
            const i = this.ghosts.indexOf(g);
            i !== -1 && this.ghosts.splice(i, 1);
            return Promise.resolve();
        }
        return g.remove();
    }

    /*
     * Get a ghost by its ghostId.
     *
     * @param {string} ghostId
     * @returns {Ghost}
     */
    getById(ghostId) {
        return this.ghostMap.get(ghostId);
    }

    /*
     * Apply a sort
     *
     * Possible values:
     *  attachment, recipient, date, kegId
     *
     * Default: kegId
     *
     * @param {string} value ['date']
     */
    sort(value) {
        switch (value) {
            case 'attachment':
                this.sortByAttachments();
                break;
            case 'recipient':
                this.sortByRecipient();
                break;
            case 'date':
                this.sortByDate();
                break;
            default:
                this.sortByKegId();
        }
        if (this.ghosts.length === 0) return;
        this.selectedId = this.ghosts[0].ghostId;
    }

    /*
     * Sort by kegId, ascending.
     */
    sortByKegId() {
        this.ghosts = _.sortBy(this.ghostMap.toJS(), g => g.id);
        this.selectedSort = 'kegId';
    }

    /*
     * Sort by sent date, descending.
     */
    sortByDate() {
        this.ghosts = _.sortBy(this.ghostMap.toJS(), g => -g.timestamp);
        this.selectedSort = 'date';
    }

    /*
     * Sort by whether files have attachments.
     */
    sortByAttachments() {
        this.ghosts = _.sortBy(this.ghostMap.toJS(), g => g.files.length === 0);
        this.selectedSort = 'attachment';
    }

    /*
     * Sort by the first recipient.
     * @fixme this doesn't make much sense?
     */
    sortByRecipient() {
        this.ghosts = _.sortBy(this.ghostMap.toJS(), g => g.recipients[0]);
        this.selectedSort = 'recipient';
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'ghosts', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowArray([]);
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'ghostMap', [observable], {
    enumerable: true,
    initializer: function () {
        return observable.shallowMap({});
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'loading', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'loaded', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'updating', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'selectedId', [observable], {
    enumerable: true,
    initializer: function () {
        return null;
    }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'selectedSort', [observable], {
    enumerable: true,
    initializer: function () {
        return 'kegId';
    }
}), _applyDecoratedDescriptor(_class.prototype, 'selectedGhost', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'selectedGhost'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'sort', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'sort'), _class.prototype)), _class);


module.exports = new GhostStore();