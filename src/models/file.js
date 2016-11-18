const Keg = require('./kegs/keg');
const { observable } = require('mobx');

class File extends Keg {
    constructor(db, fullPathOrName) {
        super(null, 'file', db);
        this.name = fullPathOrName.replace(/^.*[\\/]/, '');
    }

    /**
     * Server needs some time to process file and upload it to cloud
     * before it can be downloaded. This property reflects the processing status.
     */
    @observable fileProcessingState;

    serializeKegPayload() {
        return {
            name: this.name
        };
    }

    deserializeKegPayload(data) {
        this.name = data.name;
        this.size = data.size;
    }

    serializeProps() {
        return {
            fileId: this.fileId,
            size: this.size,
            type: this.type
        };
    }

    deserializeProps(props) {
        this.fileId = props.fileId;
        this.fileProcessingState = props.fileProcessingState;
        this.size = props.size;
        this.type = props.type;
    }

    static getByFileId(fileId) {

    }
}


module.exports = File;
