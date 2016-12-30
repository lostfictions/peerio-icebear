const systemWarnings = require('../../src/models/system-warning');
const User = require('../../src/models/user');
const helpers = require('../helpers');
const socket = require('../../src/network/socket');
const _ = require('lodash');

describe('system warnings', function() {
    this.timeout(25000);

    it('can add a system warning', function() {
        systemWarnings.add({
            content: 'some text',
            data: {
                a: '123',
                b: '456'
            }
        });
        systemWarnings.collection[0].content.should.equal('some text');
        systemWarnings.collection[0].label.should.equal('ok');
    });

    it('should receive server warning', function(done) {
        const userInst1 = new User();
        const userInst2 = new User();
        userInst1.username = userInst2.username = helpers.getRandomUsername();
        userInst1.passphrase = userInst2.passphrase = 'icebear';
        userInst1.email = `${userInst1.username}@mailinator.com`;
        userInst1.firstName = 'Severus';
        userInst1.lastName = 'Snape';

        socket.onceConnected(() => {
            userInst1.createAccountAndLogin()
                .then(() => {
                    socket.send('/auth/testServerWarning');
                })
                .then(() => {
                    socket.close();
                    socket.onceConnected(() => {
                        let count = 0;
                        socket.subscribe(socket.APP_EVENTS.serverWarning, () => {
                            count += 1;
                            if (count > 1) {
                                const messages = _.map(systemWarnings.collection, 'content');
                                messages.indexOf('testwarning').should.be.greaterThan(-1);
                                done();
                            }
                        });
                    });
                    socket.open();
                })
                .catch(err => {
                    done(err);
                });
        });

    });
});
