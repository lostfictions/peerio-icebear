/**
 * 'buffer' module extensions.
 * This is a side-effect module it modifies and exports the export of buffer module.
 * @module side-effect/buffer-extensions
 */
const Buffer = require('buffer/').Buffer;

Buffer.fromTypedArray = function(arr: Uint8Array): Uint8Array {
    // To avoid a copy, use the typed array's underlying ArrayBuffer to back new Buffer
    let buf = new Buffer(arr.buffer);
    if (arr.byteLength !== arr.buffer.byteLength) {
      // Respect the "view", i.e. byteOffset and byteLength, without doing a copy
        buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    }
    return buf;
};

exports.Buffer = Buffer;
