// @flow
/**
 * Peerio Crypto Utilities module.
 * @module crypto/util
 */

const naclUtil = require('tweetnacl-util');

/**
 * Concatenates two Uint8Arrays.
 * Returns new concatenated array.
 */
exports.concatBuffers = function(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
    const joined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    joined.set(new Uint8Array(buffer1), 0);
    joined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return joined;
};

/** Converts UTF8 string to byte array */
exports.strToBytes = (str: string): Uint8Array => naclUtil.decodeUTF8(str);
/** Converts byte array to UTF8 string */
exports.bytesToStr = (bytes: Uint8Array): string => naclUtil.encodeUTF8(bytes);
/** Converts Base64 string to byte array */
exports.b64ToBytes = (str: string): Uint8Array => naclUtil.decodeBase64(str);
/** Converts byte array to Base64 string */
exports.bytesToB64 = (bytes: Uint8Array): string => naclUtil.encodeBase64(bytes);
