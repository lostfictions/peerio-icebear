const webpackConfig = require('./webpack.config');
const testGlob = 'test/**/*.js';
const srcGlob = 'src/**/*.js';

module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [testGlob, srcGlob],
        exclude: [],
        preprocessors: {
            [testGlob]: ['webpack', 'sourcemap'],
            [srcGlob]: ['webpack']
        },
        webpack: webpackConfig,
        webpackMiddleware: { noInfo: true },
        reporters: ['nyan', 'progress', process.env.BABEL_ENV === 'coverage'? 'coverage':null].filter(i=>i!=null),
        coverageReporter: {
            reporters: [
                { type: 'lcov', dir: 'coverage/', subdir: '.' },
                { type: 'json', dir: 'coverage/', subdir: '.' },
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
                flags: ['--user-data-dir=./tests/config/.chrome_dev_user']
            }
        },
        singleRun: true,
        concurrency: Infinity
    })
};
