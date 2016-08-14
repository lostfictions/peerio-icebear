/*
 * We use webpack only to make test builds.
 * Source files are distributed as they are.
 */

const webpack = require('webpack');
const path = require('path');
const FlowStatusWebpackPlugin = require('flow-status-webpack-plugin');

module.exports = {
    entry: {
        vendor: ['blake2s-js', 'scrypt-async', 'tweetnacl', 'tweetnacl-util'],
        icebear: './icebear.js',
    },
    output: {
        filename: 'bundle.[name].js',
        path: path.resolve(__dirname, 'dist'),
        pathinfo: true
    },
    context: path.resolve(__dirname, 'src'),
    bail: false,
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel!eslint', exclude: [/node_modules/] },
            { test: /\.json$/, loader: 'json' }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': "'test'"
            },
            ENV: "'test'"
        }),
        new webpack.SourceMapDevToolPlugin({
            test: /\.js$/,
            exclude: 'bundle.vendor',
            filename: "bundle.[name].js.map",
            append: "//# sourceMappingURL=[url]",
            moduleFilenameTemplate: '[resource-path]',
            fallbackModuleFilenameTemplate: '[resource-path]',
        }),
        new FlowStatusWebpackPlugin()
    ].filter(p => !!p)
};
