const { resetApp } = require('../helpers');
const createFakeGhost = require('../fakes/ghost.fake');
const sinon = require('sinon');

let socket;

describe('Ghost API module', () => {
    beforeEach(() => {
        resetApp();
        socket = require('../../src/').socket;
    });

    it('should send a ghost', () => {
        const ghostAPI = require('../../src/models/mail/ghost.api');
        const ghost = createFakeGhost();
        const body = 'bla';

        socket.__responseMocks['/auth/ghost/send'] = [function() {
            return {};
        }];
        socket.__responseMocks['/auth/kegs/create'] = [function() {
            return {
                id: 1,
                version: 1,
                collectionVersion: 1
            };
        }, function() {
            return {
                id: 1,
                version: 1,
                collectionVersion: 1
            };
        }];
        socket.__responseMocks['/auth/kegs/update'] = [function() {
            return { collectionVersion: 2 };
        }, function() {
            return { collectionVersion: 3 };
        }];

        const deriveKeys = sinon.spy(ghostAPI, 'deriveKeys');
        const encryptGhost = sinon.spy(ghostAPI, 'encrypt');
        const sendToServer = sinon.spy(ghostAPI, 'send');
        return ghost.send(body)
            .then(() => {
                // has a keypair
                deriveKeys.should.have.been.called;
                ghost.ephemeralKeypair.secretKey.should.be.an('Uint8Array');
                ghost.ephemeralKeypair.publicKey.should.be.an('Uint8Array');
                // encrypted
                encryptGhost.should.have.been.calledWith(ghost);
                sendToServer.firstCall.args[1].body.should.be.an('Uint8Array');
                sendToServer.firstCall.args[1].signature.should.be.an('String');
                return true;
            });
    });
});
