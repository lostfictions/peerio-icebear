const { spawn } = require('child_process');
const Promise = require('bluebird');
const { runFeature } = require('./supportCode/helpers/runFeature');
const expect = require('chai').expect;

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
            'test/e2e/e2e-global-setup.js',
            '-r',
            supportCodePath,
            '--compiler',
            'js:babel-register',
            '--format',
            'json',
            '--tags',
            'not @wip',
            '--tags',
            'not @subScenario'
        ];

        const proc = spawn(cucumberPath, options);
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.on('close', () => resolve(output));
    });
};

const getScenarioNames = (json) => {
    const features = JSON.parse(json);
    return features
        .map(x => x.elements)
        .reduce((a, b) => a.concat(b))
        .map(x => x.name);
};

const runScenariosSync = (scenarios) => {
    return new Promise((resolve) => {
        const passed = [];
        const failed = [];

        Promise.each(scenarios, async (scenario) => {
            const result = await runFeature(scenario);
            if (result.succeeded) {
                passed.push(scenario);
            } else {
                failed.push({ scenario, errors: result.errors });
            }
        }).then(() => resolve({ passed, failed }));
    });
};

describe('E2E tests', () => {
    it('', () => {
        return listScenarios()
            .then((data) => {
                const json = data.toString().replace('Starting socket: wss://hocuspocus.peerio.com\n', '');
                const scenarios = getScenarioNames(json);
                console.log(scenarios);

                return runScenariosSync(scenarios)
                    .then(({ passed, failed }) => {
                        console.log('Passed:', passed);
                        console.log('Failed:', failed);
                        expect(failed).to.be.empty;
                    });
            });
    });
});
