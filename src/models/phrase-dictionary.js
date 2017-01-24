
/**
 * Passphrase dictionary module
 * @module models/phrase-dictionary
 */

const util = require('../crypto/util');

class PhraseDictionary {

    dict;

    /**
     * Creates new PhraseDictionaryCollection
     * @param dictString - '\n' separated word list
     */
    constructor(dictString) {
        this._buildDict(dictString);
    }

    /**
     * Returns a random passphrase of chosen word length
     * @length - passphrase word count
     */
    getPassphrase(length) {
        if (!this.dict) throw new Error('no dictionary available');
        let ret = '';
        for (let i = 0; i < length; i++) {
            ret += this.dict[util.getRandomNumber(0, this.dict.length)] + ' ';
        }
        return ret.trim(' ');
    }

    /** Free RAM by deleting cached dictionary */
    dispose() {
        this.dict = null;
    }

    _buildDict(dictString) {
        // normalizing words
        this.dict = dictString.split('\n');
        for (let i = 0; i < this.dict.length; i++) {
            // removing leading/trailing spaces and ensuring lower case
            this.dict[i] = this.dict[i].trim();
            // removing empty strings
            if (this.dict[i] === '') {
                this.dict.splice(i, 1);
                i--;
            }
        }
    }
}

/**
 * Singleton.
 */
class PhraseDictionaryCollection {
    dicts = {};
    currentDict = undefined;
    currentLocale = undefined;

    addDictionary(localeCode, dict) {
        if (!this.dicts[localeCode]) {
            this.dicts[localeCode] = new PhraseDictionary(dict);
        }
    }

    selectDictionary(localeCode) {
        if (!this.dicts[localeCode]) throw new Error('dictionary unavailable');
        this.currentDict = this.dicts[localeCode];
        this.currentLocale = localeCode;
    }

    get current() {
        return this.currentDict;
    }
}


module.exports = new PhraseDictionaryCollection();
