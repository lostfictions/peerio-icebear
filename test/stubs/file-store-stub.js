const sinon = require('sinon');
const FileStub = require('./file-stub');

class FileStoreStub {
    fileId = 1;

    upload() {
        return new FileStub((this.fileId++).toString());
    }

    __reset() {
        this.fileId = 1;
    }
}

module.exports = sinon.stub(new FileStoreStub());
