/**
 * Developer tool to dump any data to file using node
 */

const fs = require('fs');

class FileLogger {
    constructor(path) {
        try{
        fs.unlinkSync(path);
        } catch (err){}
        this.path = path;
    }
    append(data) {
        fs.appendFileSync(this.path, Buffer.from(data));
    }
}


module.exports = FileLogger;
