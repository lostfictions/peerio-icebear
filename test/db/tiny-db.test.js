/* eslint-disable */
//
// Local storage module tests
//

const db = require('../../src/db/tiny-db');
const keys = require('../../src/crypto/keys');
const helpers = require('../helpers');
const errors = require('../../src/errors');

// this is a sequenced test suite
describe('TinyDB', () => {
    let key, username;
    before(() => {
        key = keys.generateEncryptionKey();
        username = helpers.getRandomUsername();
        // system db is expected to open without explicit call
        db.system.should.be.defined;
    });

    function execForEachDb(testFn) {
        return Promise.all([db.system, db.user].map(testFn));
    }

    beforeEach(() => {
        db.openSystemDb();
        db.openUserDb(username, key);
        return execForEachDb(d => d.clear())
            .then(() => {
                db.openSystemDb();
                db.openUserDb(username, key);
            });
    });

    it('Create and read a value', () => {
        const key = 'test';
        const expected = 10;
        return execForEachDb(d =>
            d.setValue(key, expected)
                .then(() => d.getValue(key))
                .then(actual => expected.should.equal(actual))
        );
    });

    it('Read inexisting value', () => {
        const key = 'this_key_does_not_exist';
        return execForEachDb(d => d.getValue(key).then(actual => expect(actual).to.be.null));
    });

    it('Edit a value', () => {
        const key = 'test';
        const expected = 10;
        const expected2 = 20;
        return execForEachDb(d =>
            d.setValue(key, expected)
                .then(() => d.getValue(key))
                .then(actual => expected.should.equal(actual))
                .then(() => d.setValue(key, expected2))
                .then(() => d.getValue(key))
                .then(actual => expected2.should.equal(actual))
        );
    });

    it('Remove a value', () => {
        const key = 'test';
        const expected = 10;
        return execForEachDb(d =>
            d.setValue(key, expected)
                .then(() => d.getValue(key))
                .then(actual => expected.should.equal(actual))
                .then(() => d.removeValue(key))
                .then(() => d.getValue(key))
                .then(actual => expect(actual).to.be.null)
        );
    });

    it('Read key list', () => {
        const expected = ['key1', 'key2', 'key3'];
        return execForEachDb(d =>
            Promise.all(expected.map(k => d.setValue(k, 0)))
                .then(() => d.getAllKeys())
                .then(actual => actual.should.eql(expected))
        );
    });

    it('Delete database', () => {
        const key = 'test';
        const expected = 10;
        return execForEachDb(d =>
            d.setValue(key, expected)
                .then(() => d.getValue(key))
                .then(actual => expected.should.equal(actual))
                .then(() => d.clear())
                .then(() => d.getAllKeys())
                .then(actual => actual.should.eql([]))
        );
    });

    it('User and System databases are truly independent', () => {
        const key = 'test';
        const userValue = 'user';
        const systemValue = 'system';
        return db.user.setValue(key, userValue)
            .then(() => db.system.setValue(key, systemValue))
            .then(() => db.user.getValue(key))
            .then(actual => userValue.should.equal(actual))
            .then(() => db.system.getValue(key))
            .then(actual => systemValue.should.equal(actual));
    });

    it('User db always encrypts values', () => {
        const key = 'test';
        const expected = 'encrypted value';
        return db.user.setValue(key, expected)
            .then(() => db.user.getValue(key))
            .then(actual => expected.should.equal(actual))
            .then(() => db.openUserDb(username, keys.generateEncryptionKey()))
            .then(() => db.user.getValue(key))
            .then(() => Promise.reject('test failed'))
            .catch(err => err.should.be.instanceOf(errors.DecryptionError));
    });

    it('Should not allow empty keys', () => {
        return execForEachDb(d => {
            return Promise.any([
                d.setValue('', 1),
                d.getValue(''),
                d.removeValue(''),
                d.setValue(null, 1),
                d.getValue(null),
                d.removeValue(null),
                d.setValue(undefined, 1),
                d.getValue(undefined),
                d.removeValue(undefined)
            ])
                .then(() => Promise.reject('test failed')) // fail test if any of promises resolves
                .catch(Promise.AggregateError, err => Promise.resolve());
        });
    });

    it('Undefined value should be stored as null', () => {
        const key = 'test';
        return execForEachDb(d =>
            d.setValue(key)
                .then(() => d.getValue(key))
                .then(actual => expect(actual).to.be.null)
        );

    });


});
