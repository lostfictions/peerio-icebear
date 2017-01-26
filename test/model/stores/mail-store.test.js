const MockSocketClient = require('../../../src/network/mock-socket-client');
const socket = require('../../../src/network/socket')(MockSocketClient);
const mailStore = require('../../../src/models/stores/mail-store');


describe('mail store', () => {
    it('should do a thing', () => {
        socket.send = sinon.spy();
        return mailStore.createGhost(['sda@das.com'], 'hasjkds', [], 'icebear')
            .then(() => {
                expect(socket.send).to.have.been.called();
            });
    });
});
