const webpackConfig = require('./webpack.config');
process.env.BABEL_ENV = 'test'; // so we load the correct babel plugins
const testGlob = 'test/**/*.js';
const srcGlob = 'src/**/*.js';

module.exports = function setKarmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [testGlob, srcGlob],
        exclude: [],
        preprocessors: {
            [testGlob]: ['webpack'],
            [srcGlob]: ['webpack']
        },
        webpack: webpackConfig,
        webpackMiddleware: { noInfo: true },
        reporters: ['progress', 'coverage', 'nyan'],
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
        autoWatch: false,
        browsers: ['Chrome'],
        singleRun: true,
        concurrency: Infinity
    })
};
