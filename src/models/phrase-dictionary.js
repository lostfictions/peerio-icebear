
/**
 * Passphrase dictionary module
 * @module models/phrase-dictionary
 */

const util = require('../crypto/util');

class PhraseDictionary {

    dict;

    /**
     * Creates new PhraseDictionary
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
        let ret:string = '';
        for (let i = 0; i < length; i++) {
            ret += this.dict[util.getRandomNumber(0, this.dict.length)];
        }
        return ret;
    }

    /** Free RAM by deleting cached dictionary */
    dispose() {
        delete this.dict;
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

module.exports = PhraseDictionary;
