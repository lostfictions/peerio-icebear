/*
 * During the course of testing session we make "signout" imitating application restart
 * because we can't really restart the icebear node process, it's shared with cucumber.
 * And to avoid module cache being stored in tests, we only access modules from tests via global.ice
 */

if (global.ice) return;
global.ice = require('~/');

/*
 * Add additional modules you want to expose to tests in here.
 */

// global.ice.someModule = require('~/some/module');

/*
 * Application initialization
 */
const path = require('path');
const os = require('os');
const cfg = require('~/config');
const FileStream = require('~/models/files/node-file-stream');
const StorageEngine = require('~/src/models/storage/node-json-storage');

cfg.appVersion = '2.37.1';
cfg.clientVersion = '2.9.0';
cfg.platform = 'electron'; // todo: change name
cfg.arch = os.arch();
cfg.os = os.type();
cfg.FileStream = FileStream;
cfg.StorageEngine = StorageEngine;
cfg.StorageEngine.storageFolder = path.join(os.homedir(), '.peerio-icebear-tests');
cfg.socketServerUrl = 'wss://hocuspocus.peerio.com';

ice.socket.start();
