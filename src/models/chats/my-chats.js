const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');

/**
 * MyChats keg holds chat groups for user.
 * @extends {SyncedKeg}
 * @public
 */
class MyChats extends SyncedKeg {
    /**
     * Favorite chat ids
     * @member {Array<string>}
     * @public
     */
    favorites = [];
    /**
     * Hidden chat ids
     * @member {Array<string>}
     * @public
     */
    hidden = [];


    constructor() {
        super('my_chats', getUser().kegDb);
    }

    serializeKegPayload() {
        return {
            favorites: this.favorites,
            hidden: this.hidden
        };
    }

    deserializeKegPayload(payload) {
        this.favorites = payload.favorites;
        this.hidden = payload.hidden;
    }

    _add(array, value) {
        if (array.indexOf(value) >= 0) return false;
        array.push(value);
        return true;
    }

    _remove(array, value) {
        const ind = array.indexOf(value);
        if (ind >= 0) {
            array.splice(ind, 1);
            return true;
        }
        return false;
    }
    /**
     * Adds favorite chat and removes it from hidden list if it was there.
     * @param {string} chatId
     * @returns {boolean} - true if added, false if already had been in the list
     * @public
     */
    addFavorite(chatId) {
        const ret = this._add(this.favorites, chatId);
        if (ret) {
            this.removeHidden(chatId);
        }
        return ret;
    }

    /**
     * Removes favorite chat,
     * @param {string} chatId
     * @returns {boolean} - true if removed, false if couldn't find it in the favorites list
     * @public
     */
    removeFavorite(chatId) {
        return this._remove(this.favorites, chatId);
    }

    /**
     * Adds hidden chat and removes it from favorites list if it was there.
     * @param {string} chatId
     * @returns {boolean} - true if added, false if already had been in the list
     * @public
     */
    addHidden(chatId) {
        const ret = this._add(this.hidden, chatId);
        if (ret) {
            this.removeFavorite(chatId);
        }
        return ret;
    }

    /**
     * Removes hidden chat.
     * @param {string} chatId
     * @returns {boolean} - true if removed, false if couldn't find it in the hidden list
     * @public
     */
    removeHidden(chatId) {
        return this._remove(this.hidden, chatId);
    }
}


module.exports = MyChats;
