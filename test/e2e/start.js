import { clearSupportCodeFns } from 'cucumber';

const { spawn } = require('child_process');

const cucumberPath = 'node_modules/.bin/cucumber.js';

const runFeature = (file, done) => {
    const proc = spawn(cucumberPath, [
        `test/e2e/${file}`,
        '-r',
        'test/e2e/account/supportCode',
        '--compiler',
        'js:babel-register',
        '--require',
        'test/global-setup.js'
    ]);

    proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    proc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        done();
    });
};

const clearRequireCache = () => {
    Object.keys(require.cache).forEach(key => delete require.cache[key]);
};

describe('End to end test suite', () => {
    afterEach(() => {
        clearSupportCodeFns();
        clearRequireCache();
    });

    it('Run all files', (done) => {
        runFeature('account/stories/access.feature', done);
    });
});
