// @flow
/**
 * Various utility functions
 * @module util
 */

/** Wraps all ArrayBuffer type properties in Uint8Array recursively */
function convertBuffers(obj: Object): Object {
    if (typeof (obj) !== 'object') return obj;
/* eslint-disable guard-for-in */
    for (const prop in obj) {
        const type = typeof (obj[prop]);
        if (type !== 'object') {
            continue;
        }
        if (obj[prop] instanceof ArrayBuffer) {
            obj[prop] = new Uint8Array(obj[prop]);
        } else {
            convertBuffers(obj[prop]);
        }
    }
    return obj;
/* eslint-enable */
}

module.exports.convertBuffers = convertBuffers;
