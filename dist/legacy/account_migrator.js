'use strict';

const socket = require('../network/socket');
const BLAKE2s = require('blake2s-js');
const { cryptoUtil } = require('../crypto');
const scrypt = require('scrypt-async');
const nacl = require('tweetnacl');
const Base58 = require('./base58');

function authenticate(username, passphrase) {
    let publicKeyString;
    let keyPair;
    return deriveKeys(username, passphrase).then(keys => {
        keyPair = keys;
        publicKeyString = getPublicKeyString(keys.publicKey);
        return getAuthToken(username, publicKeyString);
    }).then(data => {
        const token = decryptAuthToken(data, keyPair);
        return socket.send('/noauth/legacy/auth-token/validate', { decryptedAuthToken: token.buffer });
    }).then(() => socket.send('/noauth/legacy/account'));
}

function derivePublicKeyString(username, passphrase) {
    return deriveKeys(username, passphrase).then(keys => {
        return getPublicKeyString(keys.publicKey);
    });
}

function getAuthToken(username, publicKeyString) {
    return socket.send('/noauth/legacy/auth-token/get', { username, publicKeyString });
}

function decryptAuthToken(data, keyPair) {
    const dToken = nacl.box.open(new Uint8Array(data.token), new Uint8Array(data.nonce), new Uint8Array(data.ephemeralServerPK), keyPair.secretKey);
    if (dToken && dToken.length === 0x20 && dToken[0] === 0x41 && dToken[1] === 0x54) {
        return dToken.slice();
    }
    throw new Error('Failed to decrypt legacy auth token');
}

function deriveKeys(username, passphrase) {
    return new Promise(resolve => {
        const keyHash = new BLAKE2s(32);
        keyHash.update(cryptoUtil.strToBytes(passphrase));
        const salt = cryptoUtil.strToBytes(username);
        scrypt(keyHash.digest(), salt, 14, 8, 32, 200, resolve);
    }).then(keyBytes => {
        return nacl.box.keyPair.fromSecretKey(new Uint8Array(keyBytes));
    });
}

function getPublicKeyString(publicKeyBytes) {
    const key = new Uint8Array(33);
    for (let i = 0; i < publicKeyBytes.length; i++) {
        key[i] = publicKeyBytes[i];
    }

    const hash = new BLAKE2s(1);
    hash.update(publicKeyBytes);
    key[32] = hash.digest()[0];

    return Base58.encode(key);
}

module.exports = { authenticate, derivePublicKeyString };