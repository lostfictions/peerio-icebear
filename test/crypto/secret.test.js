//
//  Secret key encryption module testing
//
const crypto = require('../../src/crypto/secret');
const nacl = require('tweetnacl');
const util = require('../../src/crypto/util');

describe('Secret key encryption module', () => {
    it('should encrypt and decrypt', () => {
        const key = new Uint8Array([127, 216, 168, 148, 177, 189, 134, 245, 107, 28, 100, 181, 50, 32, 94,
                                    149, 237, 193, 148, 19, 11, 103, 73, 45, 1, 17, 102, 222, 82, 227, 123, 157]);
        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const actual = crypto.decrypt(crypto.encrypt(message, key), key);
        actual.should.eql(message);
    });

    it('should be compatible with secretbox: new encrypt - old decrypt', () => {
        const key = new Uint8Array([127, 216, 168, 148, 177, 189, 134, 245, 107, 28, 100, 181, 50, 32, 94,
                                    149, 237, 193, 148, 19, 11, 103, 73, 45, 1, 17, 102, 222, 82, 227, 123, 157]);
        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const newFormatEncrypted = crypto.encrypt(message, key);
        const nonce = newFormatEncrypted.subarray(-24);
        const box = newFormatEncrypted.subarray(16, -24);
        const decrypted = nacl.secretbox.open(box, nonce, key);
        decrypted.should.eql(message);
    });

    it('should be compatible with secretbox: old encrypt - new decrypt', () => {
        const key = new Uint8Array([127, 216, 168, 148, 177, 189, 134, 245, 107, 28, 100, 181, 50, 32, 94,
                                    149, 237, 193, 148, 19, 11, 103, 73, 45, 1, 17, 102, 222, 82, 227, 123, 157]);
        const message = new Uint8Array([1, 2, 3, 4, 5]);
        const nonce = util.getRandomNonce();
        const box = nacl.secretbox(message, nonce, key);
        const oldFormatEncrypted = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...box, ...nonce]);
        const decrypted = crypto.decrypt(oldFormatEncrypted, key);
        decrypted.should.eql(message);
    });
});
