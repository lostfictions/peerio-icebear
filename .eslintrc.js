module.exports = {
    root: true,
    parser: 'babel-eslint',
    extends: [
        "peerio"
    ],
    rules:{
    },
    globals:{
        TextEncoder: false,
        TextDecoder: false,
        crypto: false,
        window: false,
        ENV: false,
        STAGING_SOCKET_SERVER: false
    }
};
