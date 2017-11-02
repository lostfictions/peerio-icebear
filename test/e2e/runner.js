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
    const json = data.toString().replace('Starting socket: wss://hocuspocus.peerio.com\n', '');
    const features = JSON.parse(json);
    const scenarios = features
        .map(x => x.elements)
        .reduce((a, b) => a.concat(b))
        .map(x => x.name);

    console.log(scenarios);
});
