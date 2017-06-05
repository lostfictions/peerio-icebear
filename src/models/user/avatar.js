const { observable } = require('mobx');
const Keg = require('../kegs/keg');

class Avatar extends Keg {

    blobs = {};

    constructor(user) {
        super('avatar', 'avatar', user.kegDb, true);
    }

    load() {
        return super.load(true);
    }

    setBlobs(blobArray) {
        this.blobs.large = blobArray[0];
        this.blobs.medium = blobArray[1];
    }

    deleteBlobs() {
        // todo: uncomment and remove current code when server removes small and tiny sizes
        // this.setBlobs([null, null]);
        this.blobs.large = null;
        this.blobs.medium = null;
        this.blobs.small = null;
        this.blobs.tiny = null;
    }

    serializeProps() {
        return this.blobs;
    }

    deserializeProps() {
        // no need
    }

}


module.exports = Avatar;
