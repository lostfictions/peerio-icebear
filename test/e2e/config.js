function getNewAppInstance() {
    const path = require('path');
    const os = require('os');
    const cfg = require('../../src/config');
    const FileStream = require('../../src/models/files/node-file-stream');
    const StorageEngine = require('../../src/models/storage/node-json-storage');

    cfg.appVersion = '';
    cfg.platform = 'electron'; // todo: change name
    cfg.arch = os.arch();
    cfg.os = os.type();
    cfg.FileStream = FileStream;
    cfg.StorageEngine = StorageEngine;
    cfg.StorageEngine.storageFolder = path.join(os.homedir(), '.peerio-icebear-tests');
    cfg.socketServerUrl = 'wss://hocuspocus.peerio.com';

    const icebear = require('../../src/index');

    icebear.socket.start();

    return icebear;
}

module.exports = getNewAppInstance;
