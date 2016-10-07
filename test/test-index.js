// require all modules ending in ".test" from the
// current directory and all subdirectories
const testsContext = require.context('.', true, /\.test$/);
testsContext.keys().forEach(testsContext);

require('./debug-modules');

const api = require('../src/icebear');

api.socket.start(api.config.socketServerUrl);
