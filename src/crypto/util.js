const naclUtil = require('tweetnacl-util');

function concatBuffers(buffer1, buffer2) {
    const joined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    joined.set(new Uint8Array(buffer1), 0);
    joined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return joined;
}

module.exports = {
    concatBuffers,
    strToBytes: naclUtil.decodeUTF8,
    bytesToStr: naclUtil.encodeUTF8,
    b64ToBytes: naclUtil.decodeBase64,
    bytesToB64: naclUtil.encodeBase64
};
