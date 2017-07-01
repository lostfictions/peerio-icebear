const execSync = require('child_process').execSync;
const fs = require('fs');

// execSync('npm run doc:build');
// execSync('git add -A docs');

const sdkFilePath = './src/__sdk.js';
// This will not be needed after we start shipping icebear with compiled sources
const pkg = JSON.parse(fs.readFileSync('./package.json'));
fs.writeFileSync(sdkFilePath, `module.exports = '${pkg.version}';\n`);
// execSync(`git add ${sdkFilePath}`);
