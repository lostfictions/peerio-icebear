const { spawn } = require('child_process');
const Promise = require('bluebird');

const cucumberPath = 'node_modules/.bin/cucumber.js';
const featurePath = 'test/e2e/spec';
const supportCodePath = 'test/e2e/supportCode';

const listScenarios = () => {
    return new Promise((resolve) => {
        let output = '';

        const options = [
            '--dry-run',
            featurePath,
            '-r',
            'test/e2e/supportCode/helpers/global-setup.js',
            '-r',
            supportCodePath,
            '--compiler',
            'js:babel-register',
            '--format',
            'json'
            // '--tags',
            // '\'not @wip\''
        ];

        const proc = spawn(cucumberPath, options);
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.on('close', () => resolve(output));
    });
};

listScenarios().then((data) => {
    console.log(data);
    // const result = JSON.parse(data[0]);
    // console.log(result);
});
