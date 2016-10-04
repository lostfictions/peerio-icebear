//
//  Crypto keys module testing
//
const crypto = require('../../src/crypto/keys');
const util = require('../../src/crypto/util');

describe('Crypto Keys module', () => {
    it('should derive keys', () => {
        const username = 'user';
        const passphrase = 'hidden award watts chained restored';
        const salt = util.b64ToBytes('r/g3Xm1OSaESajdXKPjxsefpjH7cKgSyX14KRUtepw0=');

        const expected = {
            bootKey: util.b64ToBytes('6VdJvLy8r/bDf9iXNIHhktuf4j20IqixWjnX57cQ0QU='),
            authKeyPair: {
                publicKey: util.b64ToBytes('5clLsoQ9M53zkq9L6SJn01HtlDLPeUdz4ic5GjIsWEI='),
                secretKey: util.b64ToBytes('SfhzTkRcLxw12REVkPDBntIE9sSFn/WMoNAmCOrS8RA=')
            }

        };

        return crypto.deriveKeys(username, passphrase, salt)
            .then((actual) => {
                expect(actual).to.deep.equal(expected);
            });
    });

    it('should generate signing keys', () => {
        const keys = crypto.generateSigningKeyPair();
        keys.publicKey.length.should.equal(32);
        keys.secretKey.length.should.equal(64);
    });

    it('should generate public key encryption keys', () => {
        const keys = crypto.generateEncryptionKeyPair();
        keys.publicKey.length.should.equal(32);
        keys.secretKey.length.should.equal(32);
    });

    it('should generate symmetric encryption key', () => {
        const key = crypto.generateEncryptionKey();
        key.length.should.equal(32);
    });
});
