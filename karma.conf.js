const webpack = require('webpack');
const path = require('path');

module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: [
            'mocha', 'chai'
        ],
        files: ['test/test-index.js'],
        exclude: [],
        preprocessors: {
            'test/test-index.js': ['webpack', 'sourcemap']
        },
        webpack: {
            devtool: "inline-source-map",
            context: path.resolve(__dirname, 'src'),
            bail: true,
            module: {
                loaders: [
                    {
                        test: /\.js$/,
                        loader: 'babel',
                        exclude: [/node_modules/],
                        query: {
                            "plugins": [
                                "transform-decorators-legacy",
                                "transform-class-properties",
                                "transform-inline-environment-variables",
                                "transform-es2015-modules-commonjs",
                                [
                                    "transform-object-rest-spread", {
                                        "useBuiltIns": true
                                    }
                                ],
                                "transform-react-jsx"
                            ],
                            "env": {
                                "coverage": {
                                    "plugins": [
                                        [
                                            "__coverage__", {
                                                "ignore": "*.+(test|stub).*"
                                            }
                                        ]
                                    ]
                                }
                            }
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
                    ENV: "'dev'",
                    STAGING_SOCKET_SERVER: JSON.stringify(process.env.PEERIO_STAGING_SOCKET_SERVER)
                })
            ]
        },
        webpackMiddleware: {
            noInfo: true
        },
        reporters: [
            'nyan', 'progress', process.env.BABEL_ENV === 'coverage'
                ? 'coverage'
                : null
        ].filter(i => i != null),
        coverageReporter: {
            reporters: [
                {
                    type: 'lcov',
                    dir: 'coverage/',
                    subdir: '.'
                },
                //  { type: 'json', dir: 'coverage/', subdir: '.' },
                {
                    type: 'text-summary'
                }
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