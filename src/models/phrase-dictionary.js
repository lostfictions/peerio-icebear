
/**
 * Passphrase dictionary module
 * @module models/phrase-dictionary
 */

const util = require('../crypto/util');

class PhraseDictionary {
    locale;
    dict;

    /**
     * Creates new PhraseDictionaryCollection
     * @param {string} locale - locale code for dict
     * @param {string} dictString - '\n' separated word list
     */
    constructor(locale, dictString) {
        this.locale = locale;
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
            ret += this.dict[util.getRandomNumber(0, this.dict.length)];
            ret += ' ';
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

    static current;

    static setDictionary(localeCode, rawData) {
        if (PhraseDictionary.current) PhraseDictionary.current.dispose();
        PhraseDictionary.current = new PhraseDictionary(localeCode, rawData);
    }
}


module.exports = PhraseDictionary;
