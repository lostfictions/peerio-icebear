const execSync = require('child_process').execSync;
const fs = require('fs');

execSync('npm run doc:build');
execSync('git add -A docs');

const sdkFilePath = './src/__sdk.json';
// This will not be needed after we start shipping icebear with compiled sources
const pkg = JSON.parse(fs.readFileSync('./package.json'));
const sdk = JSON.parse(fs.readFileSync(sdkFilePath));
sdk.version = pkg.version;
fs.writeFileSync(sdkFilePath, JSON.stringify(sdk));
execSync(`git add ${sdkFilePath}`);
