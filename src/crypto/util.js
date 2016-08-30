// @flow
/**
 * Peerio Crypto Utilities module.
 * @module crypto/util
 */

const nacl = require('tweetnacl');
const Buffer = require('buffer').Buffer;

const HAS_TEXT_ENCODER = typeof TextEncoder !== 'undefined';
const textEncoder:TextEncoder = HAS_TEXT_ENCODER ? new TextEncoder() : null;
const textDecoder:TextDecoder = HAS_TEXT_ENCODER ? new TextDecoder() : null;

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

/**
 * Converts UTF8 string to byte array.
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
exports.strToBytes = function(str: string): Uint8Array {
    if (HAS_TEXT_ENCODER) {
        return textEncoder.encode(str);
    }
    // returning buffer will break deep equality tests since Buffer modifies prototype
    return new Uint8Array(Buffer.from(str, 'utf8').buffer);
};

/**
 * Converts byte array to UTF8 string .
 * Uses native TextEncoder with Buffer polyfill fallback.
 */
exports.bytesToStr = function(bytes: Uint8Array): string {
    if (HAS_TEXT_ENCODER) {
        return textDecoder.decode(bytes);
    }
    return Buffer.fromTypedArray(bytes).toString('utf8');
};

/** Converts Base64 string to byte array. */
exports.b64ToBytes = function(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'base64').buffer);
};
/** Converts byte array to Base64 string. */
exports.bytesToB64 = function(bytes: Uint8Array): string {
    return Buffer.fromTypedArray(bytes).toString('base64');
};

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
