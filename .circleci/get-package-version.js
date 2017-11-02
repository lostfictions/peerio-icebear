const fs = require('fs');
console.log(JSON.parse(fs.readFileSync('package.json', 'utf-8')).version)
