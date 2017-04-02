function mockPhraseDictionary() {
    const PhraseDictionary = require('../../src/models/phrase-dictionary');
    const mockDict = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n';

    PhraseDictionary.setDictionary('en', mockDict);
}

module.exports = mockPhraseDictionary;
