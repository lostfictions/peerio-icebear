
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const W3CWebSocket = require('websocket').w3cwebsocket;

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

if (!console.debug) {
    console.debug = console.log.bind(console);
}

global.WebSocket = W3CWebSocket;
global.expect = chai.expect;
