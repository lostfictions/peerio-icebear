const TinyDb = require('../db/tiny-db');
const _ = require('lodash');
const { observable, action } = require('mobx');
/**
 * Base class for any Most Recently Used implementations
 * Gotchas: Don't create 2+ instances for the same list name. Due to caching it will lead to conflicts.
 */
class MRUList {
    /**
     * Observable list of current MRU list. DO NOT MODIFY.
     */
    @observable.shallow list = [];
    _name;
    _limit;
    /**
     * Creates an instance of MRU List
     * @param {string} name - unique name for the list
     * @param {number} limit - maximum number of elements in the list
     */
    constructor(name, limit = 10) {
        this._name = `MRU_${name}`;
        this._limit = limit;
    }

    async loadCache() {
        const list = await TinyDb.user.getValue(this._name);
        if (list) this.list = list;
    }

    _saveCache = _.throttle(() => {
        return TinyDb.user.setValue(this._name, this.list.peek());
    }, 3000);


    /**
     * Adds item usage fact to the list
     * @param {string} item
     */
    @action addItem(item) {
        this.list.remove(item);
        this.list.unshift(item);
        this.list.splice(this._limit);
        this._saveCache();
    }
}

module.exports = MRUList;
