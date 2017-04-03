const socket = require('../network/socket');
const errors = require('../errors');

const maxRetryCount = 120; // will bail out after this amount of retries
const minRetryInterval = 1000; // will start with this interval between retries
const maxRetryInterval = 10000; // this will be the maximum interval between retries
const retryIntervalMultFactor = 250; // every retry will add this amount to retry interval

const callsInProgress = {};
/**
 * 1. Executes the passed function
 * 2. If promise returend by function rejects - goto 1
 * Makes sure socket is authenticated before calling, and waits for it to become authenticated if needed.
 * @param {function} fn - function to execute
 * @param {[string]} id - unique id for this action, to prevent multiple parallel attempts
 * @returns {Promise} - resolves when action is finally executed, never rejects
 */
function retryUntilSuccess(fn, id = Math.random(), thisIsRetry) {
    // don't make parallel calls
    if (!thisIsRetry && callsInProgress[id]) return callsInProgress[id].promise;

    const callInfo = { retryCount: 0 };
    callInfo.promise = new Promise((resolve, reject) => {
        callInfo.resolve = resolve;
        callInfo.reject = reject;
    });
    callsInProgress[id] = callInfo;

    fn().tap((res) => {
        callInfo.resolve(res);
        delete callsInProgress[id];
    }).catch(err => {
        callInfo.lastError = err;
        scheduleRetry(fn, id);
        console.debug(err);
    });

    return callInfo.promise;
}
// todo: don't retry if throttled
function scheduleRetry(fn, id) {
    console.debug(`Retrying ${id} in 1 second`);
    const callInfo = callsInProgress[id];
    if (callInfo.retryCount++ > maxRetryCount) {
        console.error(`Maximum retry count reached for action id ${id}. Giving up, rejecting promise.`);
        console.debug(fn);
        callInfo.reject(errors.normalize(callInfo.lastError));
        return;
    }
    setTimeout(
        () => socket.onceAuthenticated(() => retryUntilSuccess(fn, id, true)),
        minRetryInterval + Math.min(maxRetryInterval, (callInfo.retryCount * retryIntervalMultFactor))
    );
}


module.exports = { retryUntilSuccess };
