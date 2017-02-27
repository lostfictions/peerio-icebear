const sinon = require('sinon');

class FileStub {
    constructor(fileId) {
        this.fileId = fileId;
    }

    share = sinon.stub();
}

module.exports = FileStub;
