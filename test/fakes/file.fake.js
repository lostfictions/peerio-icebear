
function createFakeFile() {
    const File = require('../../src/models/files/file');
    const file = new File();
    file.fileId = Math.random().toString();
    file.name = `${Math.random().toString()}.xlsx`;
    file.size = Math.round(Math.random() * 1000);
    file.uploadedAt = Date.now() - 10000;
    file.readyForDownload = true;
    return file;
}

module.exports = createFakeFile;
