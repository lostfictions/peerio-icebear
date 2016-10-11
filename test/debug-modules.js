// Just a list of modules pre-required to access from console

const m = window.modules = {};

m.socket = require('../src/network/socket');
m.kegClient = require('../src/network/keg-client');
