const { spawn } = require('child_process');
const Promise = require('bluebird');

const cucumberPath = 'node_modules/.bin/cucumber.js';
const featurePath = 'test/e2e/helpers/featureHelpers.feature';
const supportCodePath = 'test/e2e/account/supportCode'; // todo: better way to do this
const supportCodePath2 = 'test/e2e/storage/supportCode';

const getPeerioDataFrom = (output) => {
    const dataRegex = /<peerioData>.+<\/peerioData>/g;

    let found = output.match(dataRegex);
    if (found) {
        found = found.map(x => x.replace('<peerioData>', ''));
        found = found.map(x => x.replace('</peerioData>', ''));
    }

    const result = JSON.parse(found);
    return result;
};

const getScenarioSummary = (output) => {
    const dataRegex = /\d+ scenario(|s) \(.*\)/g;

    const found = output.match(dataRegex);
    return found;
};

const scenarioPassed = (output) => {
    const result = getScenarioSummary(output).toString();
    const hasFailed = !!result.match(/failed/);
    const hasSkipped = !!result.match(/skipped/);

    return result && !hasFailed && !hasSkipped;
};

const runFeature = (scenarioName, peerioData = null) => {
    return new Promise((resolve) => {
        let output = '';
        let errors = '';

        const options = [
            featurePath,
            '-r',
            supportCodePath,
            '-r',
            supportCodePath2,
            '--compiler',
            'js:babel-register',
            '--require',
            'test/global-setup.js',
            '--name',
            scenarioName
        ];

        const env = Object.create(process.env);
        if (peerioData !== null) {
            env.peerioData = JSON.stringify(peerioData);
        }

        const proc = spawn(cucumberPath, options, { env });

        proc.stdout.on('data', (data) => {
            process.stdout.write(data);
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            process.stdout.write(data);
            errors += data.toString();
        });

        proc.on('close', () => {
            const result = {};
            result.succeeded = scenarioPassed(output);

            if (result.succeeded) {
                result.data = getPeerioDataFrom(output);
            }

            if (errors) {
                result.errors = errors;
            }

            resolve(result);
        });
    });
};

module.exports = runFeature;
