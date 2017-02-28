// todo: conditional (DEV/PROD) configuration

const cfg = require('../src/config');
const FileStream = require('../src/models/files/node-file-stream');
const StorageEngine = require('../src/models/stores/node-json-storage');
const os = require('os');
const path = require('path');

cfg.socketServerUrl = 'wss://hocuspocus.peerio.com';
cfg.ghostFrontendUrl = 'https://alakazam.peerio.com/';
cfg.FileStream = FileStream;
cfg.StorageEngine = StorageEngine;
cfg.StorageEngine.storageFolder = path.join(os.homedir(), '.peerio-icebear-tests');

module.exports = cfg;
