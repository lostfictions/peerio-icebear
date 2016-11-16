const Keg = require('./kegs/keg');

class File extends Keg {
    constructor(db, fullPath) {
        super(null, 'file', db);
        this.name = fullPath.replace(/^.*[\\/]/, '');
        this.size = 0;
    }
    @observable fileId;
    get fileId() {
        return this.props.fileId;
    }

    set fileId(val) {
        this.props.fileId = val;
    }

    get name

    /**
     * Server needs some time to process file and upload it to cloud
     * before it can be downloaded. This property reflects the processing status.
     * @return {*}
     */
    get processingState() {
        return this.props.fileProcessingState;
    }

    serializeKegPayload() {
        return {
            name: this.name,
            size: this.size
        };
    }

    deserializeKegPayload(data) {
        this.name = data.name;
        this.size = data.size;
    }

    static getByFileId(fileId) {

    }
}
Object.defineProperty(d, "year", {
  get: function() { return this.getFullYear() },
  set: function(y) { this.setFullYear(y) }
});

module.exports = File;
