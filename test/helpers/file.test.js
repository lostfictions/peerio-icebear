const { resetApp } = require('../helpers');

describe('File helper should', () => {
    let helper;
    const path = '/Users/work/Documents/peerio-icebear/docs/API.md';

    beforeEach(() => {
        resetApp();
        helper = require('../../src/helpers/file');
    });

    it('return file name from path', () => {
        const expected = 'API.md';
        const actual = helper.getFileName(path);

        actual.should.equal(expected);
    });

    it('return file name without extension from path', () => {
        const expected = 'API';
        const actual = helper.getFileNameWithoutExtension(path);

        actual.should.equal(expected);
    });

    it('return extension from path', () => {
        const expected = 'md';
        const actual = helper.getFileExtension(path);

        actual.should.equal(expected);
    });
});

