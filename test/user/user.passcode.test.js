const { resetApp } = require('../helpers');

describe('User passcode', () => {
    beforeEach(() => {
        resetApp();
    });

    it('can be set, reset, and skipped', () => {
        const User = require('../../src/models/user/user');
        const db = require('../../src/db/tiny-db');

        return User.current.setPasscode('greatpasscode')
            .then(() => {
                return User.current.setPasscode('anotherpasscode');
            })
            .then(() => {
                return User.current.validatePasscode('anotherpasscode').should.be.fulfilled;
            })
            .then(() => {
                return User.current.disablePasscode();
            })
            .then(() => {
                return db.system.getValue(`${User.current.username}:passcode:disabled`).should.eventually.equal(true);
            })
            .then(() => {
                return db.system.getValue(`${User.current.username}:passcode`).should.eventually.equal(null);
            })
            .then(() => {
                return User.current.setPasscode('MOARpasscode');
            })
            .then(() => {
                return db.system.getValue(`${User.current.username}:passcode:disabled`).should.eventually.equal(null);
            })
            .then(() => {
                return User.current.validatePasscode('MOARpasscode').should.be.fulfilled;
            });
    });
});

