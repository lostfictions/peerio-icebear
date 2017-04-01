const socket = require('../network/socket');

const callsInProgress = {};

/**
 * 1. Executes the passed function
 * 2. If promise returend by function rejects - goto 1
 * Makes sure socket is authenticated before calling, and waits for it to become authenticated if needed.
 * @param {function} fn - function to execute
 * @param {[string]} id - unique id for this action, to prevent multiple parallel attempts
 */
function retryUntilSuccess(fn, id = Math.random(), thisIsRetry) {
    // don't make parallel calls
    if (!thisIsRetry && callsInProgress[id]) return callsInProgress[id].promise;

    const callInfo = { retryCount: 0 };
    callInfo.promise = new Promise(resolve => {
        callInfo.resolve = resolve;
    });
    callsInProgress[id] = callInfo;

    fn().tap(() => {
        callsInProgress[id].resolve();
        delete callsInProgress[id];
    }).catch(err => {
        scheduleRetry(fn, id);
        console.debug(err);
    });

    return callInfo.promise;
}

function scheduleRetry(fn, id) {
    console.debug(`Retrying ${id} in 1 second`);
    // todo: detect 2fa and pause retries
    callsInProgress[id].retryCount++;
    setTimeout(() => socket.onceAuthenticated(() => retryUntilSuccess(fn, id, true)), 1000);
}


module.exports = { retryUntilSuccess };
