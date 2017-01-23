/* eslint-disable */
//
// User module tests
//

const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');
const Contact = require('../../src/models/contact');
const {when} = require('mobx');
const systemWarnings = require('../../src/models/system-warning');
const _ = require('lodash');

// this is a sequenced test suite
describe('User model', function () {
    this.timeout(15000);
    // instances of User *for the same account*
    const user = new User();
    const userInst2 = new User();
    const userInst3 = new User();
    const userInst4 = new User();
    const passphrase = 'such a secret passphrase';

    // this user will persist after test run (for debug)
    window.userLogin = userInst2;

    before(function (done) {
        user.username = userInst2.username = userInst3.username = userInst4.username = helpers.getRandomUsername();
        console.log(`Test username: ${user.username}`);
        user.passphrase = userInst2.passphrase = passphrase;
        user.email = `${user.username}@mailinator.com`;
        socket.onceConnected(done);
        socket.started && socket.open();
    });

    it('#01 should server-validate username',
        () => User.validateUsername(user.username).then(available => available.should.be.true));

    it('#02 should register new user', function () {
        user.firstName = 'Severus';
        user.lastName = 'Snape';
        return user.createAccountAndLogin();
    });

    it('#03 should login', function (done) {
        user.stopReauthenticator();
        socket.close();
        socket.onceConnected(() => userInst2.login()
            .then(() => done())
            .catch(err => done(new Error(err)))
        );
        socket.open();
    });

    it('#04 can log in with passcode', function (done) {
        const passcode = 'passcode bla';
        userInst2.stopReauthenticator();
        user.setPasscode(passcode)
            .then(() => {
                socket.close();
                userInst3.passphrase = passcode;
                socket.onceConnected(() => userInst3.login()
                    .then(() => done())
                    .catch(err => done(new Error(err)))
                );
                socket.open();
            })
            .catch(err => {
                done(err);
            });
    });

    it('#05 can log in with passphrase even when passcode is set', function (done) {
        userInst3.stopReauthenticator();
        socket.close();
        userInst4.passphrase = passphrase;
        socket.onceConnected(() => userInst4.login()
            .then(() => done())
            .catch(err => done(new Error(err)))
        );
        socket.open();
    });

    it('#06 can get the last authenticated user', function () {
        return User.getLastAuthenticated()
            .then((last) => {
                console.log('last user ', last)
                last.username.should.equal(user.username);
                return User.removeLastAuthenticated()
            })
            .then(() => {
                return User.getLastAuthenticated()
            })
            .then((last) => {
                should.not.exist(last)
            })
    });

    it('Should load existing contact', function (done) {
        const c = new Contact('anritest7');
        c.load();
        when(() => !c.loading,
            () => {
                c.loading.should.be.false;
                c.notFound.should.be.false;
                c.encryptionPublicKey.should.be.a('Uint8Array');
                c.signingPublicKey.should.be.a('Uint8Array');
                done();
            });
    });

    it('Should fail on not existing contact', function (done) {
        const c = new Contact('tmux');
        c.load();
        when(() => !c.loading,
            () => {
                c.loading.should.be.false;
                c.notFound.should.be.true;
                done();
            }
        );
    });

    it('Should receive server warning', function (done) {
       let count = 0;
        // this has to get unsubscribed, but i'd rather burn the entire test file with fire later
        socket.subscribe(socket.APP_EVENTS.serverWarning, () => {
            if(++count<2) return;
            const messages = _.map(systemWarnings.collection, 'content');
            messages.indexOf('testwarning').should.be.greaterThan(-1);
            done();
        });
        socket.send('/auth/testServerWarning');
        socket.close();
        socket.open();
    });
});
