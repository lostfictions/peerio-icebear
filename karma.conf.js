const webpack = require('webpack');
const path = require('path');
const FlowStatusWebpackPlugin = require('flow-status-webpack-plugin');

module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: ['test/test-index.js'],
        exclude: [],
        preprocessors: {
            'test/test-index.js': ['webpack','sourcemap']
        },
        webpack: {
            devtool: "inline-source-map",
            context: path.resolve(__dirname, 'src'),
            bail: false,
            module: {
                loaders: [
                    { test: /\.js$/, loader: 'babel', exclude: [/node_modules/] },
                    { test: /\.json$/, loader: 'json' }
                ]
            },
            plugins: [
                new FlowStatusWebpackPlugin(),
                new webpack.optimize.DedupePlugin(),
                new webpack.ProgressPlugin()
            ]
        },
        webpackMiddleware: { noInfo: true },
        reporters: ['nyan', 'progress', process.env.BABEL_ENV === 'coverage'? 'coverage':null].filter(i=>i!=null),
        coverageReporter: {
            reporters: [
                { type: 'lcov', dir: 'coverage/', subdir: '.' },
            //    { type: 'json', dir: 'coverage/', subdir: '.' },
                { type: 'text-summary' }
            ]
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome_Debug'],
        customLaunchers: {
            Chrome_Debug: {
                base: 'Chrome',
                flags: ['--user-data-dir=./.chrome_dev_user']
            }
        },
        singleRun: true,
        concurrency: Infinity
    })
};
