/* eslint-disable no-unused-vars, global-require, no-undef */
//
// Test environment and helpers initialization code
//
const api = {
    chats: require('../src/stores/chats'),
    cryptoKeys: require('../src/crypto/keys')
};

window.icebear = api;
