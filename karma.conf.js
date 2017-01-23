const webpack = require('webpack');
const path = require('path');

module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: [
            'mocha', 'chai', 'sinon-chai'
        ],
        files: ['test/test-index.js'],
        exclude: [],
        preprocessors: {
            'test/test-index.js': ['webpack', 'sourcemap']
        },
        webpack: {
            devtool: 'inline-source-map',
            context: path.resolve(__dirname, 'src'),
            bail: true,
            module: {
                loaders: [
                    {
                        test: /\.js$/,
                        loader: 'babel',
                        exclude: [/node_modules/],
                        query: {
                            plugins: [
                                'transform-decorators-legacy',
                                'transform-class-properties',
                                'transform-inline-environment-variables',
                                'transform-es2015-modules-commonjs',
                                [
                                    'transform-object-rest-spread', {
                                    useBuiltIns: true
                                }
                                ],
                                'transform-react-jsx'
                            ],
                            env: { coverage: { plugins: [['__coverage__', { ignore: '*.+(test|stub).*' }]] } }
                        }
                    }, {
                        test: /\.json$/,
                        loader: 'json'
                    }
                ]
            },
            plugins: [
                new webpack.optimize.DedupePlugin(),
                new webpack.ProgressPlugin(),
                new webpack.DefinePlugin({
                    ICEBEAR_TEST_ENV: JSON.stringify(process.env.PEERIO_STAGING_SOCKET_SERVER)
                }),
                new webpack.ProvidePlugin( {
                    'sinon': 'sinon'
                })
            ]
        },
        webpackMiddleware: {
            noInfo: true,
            stats: {
                // Config for minimal console.log mess.
                assets: false,
                colors: true,
                version: false,
                hash: false,
                timings: false,
                chunks: false,
                chunkModules: false
            }
        },
        reporters: [
            'progress', process.env.BABEL_ENV === 'coverage' ? 'coverage' : null
        ].filter(i => i != null),
        coverageReporter: {
            reporters: [
                {
                    type: 'lcov',
                    dir: 'coverage/',
                    subdir: '.'
                },
                { type: 'json', dir: 'coverage/', subdir: '.' },
                {
                    type: 'text-summary'
                }
            ]
        },
        port: 9876,
        browserNoActivityTimeout: 60000,
        colors: true,
        logLevel: config.LOG_ERROR,
        autoWatch: true,
        concurrency: 1, // 1 browser at a time
        browsers: ['Chrome_Debug', 'Safari'],
        // browsers: ['Chrome_Debug'],
        // browsers: ['Safari'],
        customLaunchers: {
            Chrome_Debug: {
                base: 'Chrome',
                flags: ['--user-data-dir=./.chrome_dev_user']
            }
        },
        singleRun: true,
        client: {
            captureConsole: false,
            chai: {
                includeStack: true
            }
        }
    });
};
