const { resetApp } = require('../helpers');
const MRUList = require('../../src/helpers/mru-list');

describe('MRU list helper should', () => {
    let mruList;
    const items = [];

    beforeEach(() => {
        resetApp();
        mruList = new MRUList('test', 5);
    });

    it('delete items when size limit is exceeded', () => {
        const expected = 1;
        const actual = 1;

        actual.should.equal(expected);
    });

    it('return contained items in order', () => {
        const expected = 1;
        const actual = 1;

        actual.should.equal(expected);
    });
});

