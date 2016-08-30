//
//  Secret key encryption module testing
//
const crypto = require('../../src/crypto/secret');

describe('Secret key encryption module', () => {
    it('should encrypt and decrypt', () => {
        const key = new Uint8Array([127, 216, 168, 148, 177, 189, 134, 245, 107, 28, 100, 181, 50, 32, 94,
                                    149, 237, 193, 148, 19, 11, 103, 73, 45, 1, 17, 102, 222, 82, 227, 123, 157]);
        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const actual = crypto.decrypt(crypto.encrypt(message, key), key);
        actual.should.eql(message);
    });
    // TODO compatibility with original nacl.secretbox() and nacl.secretbox.open()
});
