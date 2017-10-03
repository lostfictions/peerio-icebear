const { spawn } = require('child_process');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

const cucumberPath = 'node_modules/.bin/cucumber.js';
const supportCodePath = 'test/e2e/account/supportCode'; // todo: *
const testFolder = 'test/e2e/';

const getFeatureFiles = () => {
    const features = [];

    const dirs = fs.readdirSync(testFolder);
    dirs.forEach((item) => {
        const storiesFolder = path.resolve(__dirname, `${item}/stories`);
        if (fs.existsSync(storiesFolder)) {
            const foundFeatures = fs.readdirSync(storiesFolder);
            foundFeatures.forEach((file) => {
                features.push(`${item}/stories/${file}`);
            });
        }
    });

    return features;
};

const runFeature = (file) => {
    return new Promise((resolve) => {
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
