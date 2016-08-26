//
//  Crypto utilities module testing
//
const util = require('../../src/crypto/util');

describe('Crypto Utilities module', () => {
    [
        {
            name: '2 non-empty arrays',
            arg1: new Uint8Array([1, 5, 7]),
            arg2: new Uint8Array([8, 3, 5, 3, 2]),
            expected: new Uint8Array([1, 5, 7, 8, 3, 5, 3, 2]) },
        {
            name: 'first array is empty',
            arg1: new Uint8Array([]),
            arg2: new Uint8Array([4, 5]),
            expected: new Uint8Array([4, 5])
        },
        {
            name: 'second array is empty',
            arg1: new Uint8Array([6, 7, 8, 9]),
            arg2: new Uint8Array([]),
            expected: new Uint8Array([6, 7, 8, 9])
        },
        {
            name: 'both arrays are empty',
            arg1: new Uint8Array([]),
            arg2: new Uint8Array([]),
            expected: new Uint8Array([])
        },
        {
            name: 'broken',
            arg1: new Uint8Array([4, 3, 4]),
            arg2: new Uint8Array([5, 6, 7, 8]),
            expected: new Uint8Array([5, 4, 3]),
            negate: true
        }
    ].forEach(test => {
        it(`should concatenate buffers. case: ${test.name}`, () => {
            const actual = util.concatTypedArrays(test.arg1, test.arg2);
            actual.should.be.instanceOf(Uint8Array);
            test.negate ? actual.should.not.eql(test.expected) : actual.should.eql(test.expected);
        });
    });

    it('should encode and decode string', () => {
        const str = 'test string to decode';
        const bytes = new Uint8Array([116, 101, 115, 116, 32, 115, 116, 114, 105, 110, 103,
            32, 116, 111, 32, 100, 101, 99, 111, 100, 101]);

        const actualBytes = util.strToBytes(str);
        const actualStr = util.bytesToStr(bytes);
        actualBytes.should.be.instanceOf(Uint8Array);
        actualBytes.should.eql(bytes);
        actualStr.should.eql(str);
    });

    it('should encode and decode base64', () => {
        const str = 'ZBYjLgU+Qwk=';
        const bytes = new Uint8Array([100, 22, 35, 46, 5, 62, 67, 9]);
        const actualStr = util.bytesToB64(bytes);
        const actualBytes = util.b64ToBytes(str);
        actualBytes.should.be.instanceOf(Uint8Array);
        actualBytes.should.eql(bytes);
        actualStr.should.eql(str);
    });

    it('should generate nonce', () => {
        const nonce = util.getRandomNonce();
        nonce.should.be.instanceOf(Uint8Array);
        nonce.length.should.equal(24);
    });
});
