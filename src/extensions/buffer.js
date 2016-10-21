
/**
 * 'buffer' module extensions.
 * Modifies and exports Buffer module.
 * @module extensions/buffer
 */
const Buffer = require('buffer/').Buffer;

Buffer.fromTypedArray = function(arr) {
    // To avoid a copy, use the typed array's underlying ArrayBuffer to back new Buffer
    let buf = new Buffer(arr.buffer);
    if (arr.byteLength !== arr.buffer.byteLength) {
      // Respect the "view", i.e. byteOffset and byteLength, without doing a copy
        buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    }
    return buf;
};
