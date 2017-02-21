// require all modules ending in ".test" from the
// currentDict directory and all subdirectories
const testsContext = require.context('.', true, /\.test$/);
testsContext.keys().forEach(testsContext);

require('./debug-modules');

require('../src');

// api.socket.start(api.config.socketServerUrl);
