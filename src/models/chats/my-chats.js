const SyncedKeg = require('../kegs/synced-keg');
const { getUser } = require('../../helpers/di-current-user');

// List of user's chats macro data/flags
class MyChats extends SyncedKeg {

    favorites = [];
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

    addFavorite(chatId) {
        const ret = this._add(this.favorites, chatId);
        if (ret) {
            this.removeHidden(chatId);
        }
        return ret;
    }

    removeFavorite(chatId) {
        return this._remove(this.favorites, chatId);
    }

    addHidden(chatId) {
        const ret = this._add(this.hidden, chatId);
        if (ret) {
            this.removeFavorite(chatId);
        }
        return ret;
    }

    removeHidden(chatId) {
        return this._remove(this.hidden, chatId);
    }
}


module.exports = MyChats;
