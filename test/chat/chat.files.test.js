const { resetApp } = require('../helpers');
const createFakeChat = require('../fakes/chat.fake');
const createFakeFile = require('../fakes/file.fake');
const sinon = require('sinon');

/**
 * Here we test file handling inside chats.
 */
describe('Chat files module', () => {
    beforeEach(() => {
        resetApp();
    });

    it('should share files', () => {
        // we need a chat object
        const chat = createFakeChat(2);
        sinon.stub(chat, 'sendMessage');
        // and a few files
        const files = [createFakeFile(), createFakeFile()];
        // we don't really want file.share() to execute in the scope of this test
        files.forEach(f => sinon.stub(f, 'share'));
        // Test call
        chat.shareFiles(files);
        // verifying
        // that file.share() was called for every participant
        files.forEach(f => {
            f.share.calledTwice.should.be.true;
            f.share.withArgs(chat.participants[0]).calledOnce.should.be.true;
            f.share.withArgs(chat.participants[1]).calledOnce.should.be.true;
        });
        // that message was sent to the chat
        chat.sendMessage.calledOnce.should.be.true;
        chat.sendMessage.firstCall.args[0].should.equal('');
        chat.sendMessage.firstCall.args[1].should.eql([files[0].fileId, files[1].fileId]);
    });

    it('should upload and share file', () => {
        // sharing is tested in previous test case, here we stub it
        const chatFiles = require('../../src/models/chats/chat.files');
        sinon.stub(chatFiles, 'share');

        const chat = createFakeChat();
        const fileStore = require('../../src/models/stores/file-store');
        const file = createFakeFile();
        // imitating new file
        file.readyForDownload = false;
        sinon.stub(fileStore, 'upload').returns(file);
        // making test call
        chat.uploadAndShareFile('/dir/file.ext');
        // file should be queued
        chat.uploadQueue[0].should.equal(file);
        chat.uploadQueue.length.should.equal(1);
        // imitating finished upload
        file.readyForDownload = true;
        chat.uploadQueue.length.should.equal(0);
        chatFiles.share.calledOnce.should.be.true;
        chatFiles.share.firstCall.args[0].should.equal(chat);
        chatFiles.share.firstCall.args[1][0].should.equal(file);
        chatFiles.share.firstCall.args[1].length.should.equal(1);
    });
});
