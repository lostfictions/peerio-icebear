const { spawn } = require('child_process');
const Promise = require('bluebird');

const cucumberPath = 'node_modules/.bin/cucumber.js';
const supportCodePath = 'test/e2e/account/supportCode'; // todo: *

const getFeatureFiles = () => {
    return [
        'account/stories/access.feature',
        'account/stories/newUser.feature'
    ];
};

const runFeature = (file) => {
    return new Promise((resolve, reject) => {
        let output = '';
        let errors = '';

        const proc = spawn(cucumberPath, [
            `test/e2e/${file}`,
            '-r',
            supportCodePath,
            '--compiler',
            'js:babel-register',
            '--require',
            'test/global-setup.js'
        ]);

        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { errors += data.toString(); });
        proc.on('close', () => { resolve({ output, errors }); });
    });
};

const getScenarioSummary = (output) => {
    return output.substring(output.lastIndexOf('scenario') - 2, output.length);
};

const start = () => {
    let results = '';
    const files = getFeatureFiles();

    Promise
        .each(files, (item) => {
            return runFeature(item)
                .then(({ output, errors }) => {
                    console.log(`Feature output: ${output}`);
                    console.log(`Feature errors: ${errors}`);

                    results += `\nFile: ${item}\n`;
                    results += getScenarioSummary(output);
                });
        })
        .catch(e => console.log(`feature returned error: ${e}`))
        .then(() => console.log(`\nRESULTS:\n${results}`));
};

start();
