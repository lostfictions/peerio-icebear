const ChatFiles = require('../../build/models/chats/chat.files');
const FileStub = require('../stubs/file-stub');
const fileStoreStub = require('../stubs/file-store-stub');

const mock = require('mock-require');

describe('Chat files module', () => {
    function getChatMock() {
        return {
            participants: [{ u: 'alice', isMe: true }, { u: 'bob' }, { u: 'david' }],
            uploadQueue: []
        };
    }

    const filesMock = [new FileStub('1'), new FileStub('2'), new FileStub('3')];

    before(() => {
        mock('../../build/models/stores/file-store', '../stubs/file-store-stub');
    });

    after(() => {
        mock.stopAll();
    });

    it('should share files', () => {
        const chatMock = getChatMock();
        const expected = ['1', '2', '3'];
        const actual = ChatFiles.share(chatMock, filesMock);
        actual.should.eql(expected);
        filesMock.forEach(f => {
            f.share.calledTwice.should.be.true;
            f.share.withArgs(chatMock.participants[1]).calledOnce.should.be.true;
            f.share.withArgs(chatMock.participants[2]).calledOnce.should.be.true;
        });
    });

    it('should upload and share file', () => {
        const chatMock = getChatMock();
        const path = '/test/file.jpg';
        ChatFiles.uploadAndShare(chatMock, path);
    });
});
