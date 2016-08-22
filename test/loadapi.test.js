/* eslint-disable no-unused-vars, global-require, no-undef */

const api = {
    conversations: require('../src/lib/store/conversations'),
    cryptoKeys: require('../src/crypto/keys')
};

window.icebear = api;
