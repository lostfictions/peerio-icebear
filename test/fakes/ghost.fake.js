function createFakeGhost() {
    const Ghost = require('../../src/models/mail/ghost');
    return new Ghost();
}

module.exports = createFakeGhost;
