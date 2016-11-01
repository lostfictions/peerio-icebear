module.exports = {
    root: true,
    parser: 'babel-eslint',
    extends: [
        "peerio"
    ],
    rules:{
        "no-labels":0
    },
    globals:{
        TextEncoder: false,
        TextDecoder: false,
        crypto: false,
        window: false,
        xdescribe:false,
        ENV: false,
        STAGING_SOCKET_SERVER: false
    }
};
