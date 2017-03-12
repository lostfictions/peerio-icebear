function mockPhraseDictionary () {
    const PhraseDictionaryCollection = require('../../src/models/phrase-dictionary');
    const mockDict = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n';

    PhraseDictionaryCollection.addDictionary('en', mockDict);
    PhraseDictionaryCollection.selectDictionary('en');
}

module.exports = mockPhraseDictionary;
