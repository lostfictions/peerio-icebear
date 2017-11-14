// Use this module only within tests.
// It's not safe to use it in production.
// Always restart js context/process on signout.

function signout() {
    const g = global || window;
    g.ice.socket.close();
    require('mobx').extras.resetGlobalState(); // eslint-disable-line global-require
    delete g.ice;
    delete g.__mobxInstanceCount;
    if (g.gc) {
        g.gc();
    }
    Object.keys(require.cache).forEach(key => { delete require.cache[key]; });
    if (Object.keys(require.cache).length) {
        throw new Error('Failed to clear require cache', require.cache);
    }
}

module.exports = signout;
