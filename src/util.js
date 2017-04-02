
/**
 * Various utility functions
 * @module util
 */

/** Wraps all ArrayBuffer type properties with Uint8Array recursively */
function convertBuffers(obj) {
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

/**
 * Converts bytes number to readable string format
 * @param {number} bytes
 */
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1048576) return `${+(bytes / 1024).toFixed(2)} KB`;
    else if (bytes < 1073741824) return `${+(bytes / 1048576).toFixed(2)} MB`;
    return `${+(bytes / 1073741824).toFixed(2)} GB`;
}

module.exports = { convertBuffers, formatBytes };

