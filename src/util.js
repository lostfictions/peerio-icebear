// @flow
/**
 * Various utility functions
 * @module util
 */

/** Wraps all ArrayBuffer type properties in Uint8Array recursively */
function convertBuffers(obj: Object) {
    if (typeof (obj) !== 'object') return;
    for (const prop in obj) { // elsint-disable-line guard-for-in
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
}

module.exports.convertBuffers = convertBuffers;
