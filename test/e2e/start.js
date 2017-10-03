import { clearSupportCodeFns } from 'cucumber';

const { spawn } = require('child_process');
const Promise = require('bluebird');

const cucumberPath = 'node_modules/.bin/cucumber.js';
const supportCodePath = 'test/e2e/account/supportCode'; // todo: *

const runFeature = (file) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cucumberPath, [
            `test/e2e/${file}`,
            '-r',
            supportCodePath,
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
            resolve();
        });
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
        const files =
            [
                'account/stories/access.feature',
                'account/stories/newUser.feature'
            ];

        Promise
            .each(files, (item) => runFeature(item))
            .catch(e => console.log(`feature returned error: ${e}`))
            .finally(done);
    });
});
