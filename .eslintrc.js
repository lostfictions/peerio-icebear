module.exports = {
    root: true,
    parser: 'babel-eslint',
    extends: [
        'peerio'
    ],
    rules: {
        'no-labels': 0,
        'no-mixed-operators': 0,
        'no-multi-assign': 0,
        'no-restricted-properties': 1,
        'no-void': 0,
        'import/no-unresolved': 0
    },
    globals: {
        TextEncoder: false,
        TextDecoder: false,
        crypto: false,
        window: false,
        xdescribe: false,
        WebSocket: false,
        XMLHttpRequest: false
    }
};
