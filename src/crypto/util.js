// @flow
/**
 * Peerio Crypto Utilities module.
 * @module crypto/util
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
/**
 * Concatenates two Uint8Arrays.
 * Returns new concatenated array.
 */
exports.concatTypedArrays = function(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
    const joined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    joined.set(new Uint8Array(buffer1), 0);
    joined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return joined;
};

/** Converts UTF8 string to byte array. */
exports.strToBytes = (str: string): Uint8Array => naclUtil.decodeUTF8(str);
/** Converts byte array to UTF8 string. */
exports.bytesToStr = (bytes: Uint8Array): string => naclUtil.encodeUTF8(bytes);
/** Converts Base64 string to byte array. */
exports.b64ToBytes = (str: string): Uint8Array => naclUtil.decodeBase64(str);
/** Converts byte array to Base64 string. */
exports.bytesToB64 = (bytes: Uint8Array): string => naclUtil.encodeBase64(bytes);

/** Generates 24-byte unique(almost) random nonce. */
exports.getRandomNonce = function(): Uint8Array {
    const nonce = new Uint8Array(24);
    // we take last 4 bytes of current timestamp
    nonce.set(numberToByteArray(Date.now() >>> 32));
    // and 20 random bytes
    nonce.set(nacl.randomBytes(20), 4);
    return nonce;
};

function numberToByteArray(num: number): Array<number> {
    return [num & 0xff, (num >>> 8) & 0xff, (num >>> 16) & 0xff, num >>> 24];
}
