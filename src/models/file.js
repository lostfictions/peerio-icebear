const Keg = require('./kegs/keg');
const { observable, autorun } = require('mobx');
const FileStreamAbstract = require('./file-stream');
const keys = require('../crypto/keys');
const util = require('../crypto/util');
const secret = require('../crypto/secret');
const User = require('./user');
const fileHelper = require('../helpers/file');
const errors = require('../errors');
const socket = require('../network/socket');
const FileUploader = require('./file-uploader');
const FileNonceGenerator = require('./file-nonce-generator');

class File extends Keg {
    constructor(db) {
        super(null, 'file', db);
        autorun(() => {
            this.ext = fileHelper.getFileExtension(this.name);
        });
    }

    /**
     * Server needs some time to process file and upload it to cloud
     * before it can be downloaded. This property reflects the processing status.
     */
    @observable fileProcessingState;
    @observable uploading = false;
    @observable downloading = false;
    @observable progress = 0;
    @observable progressBuffer = 0;
    @observable name = '';
    @observable ext ='';
    @observable size = 0;
    @observable uploadedAt = null;

    serializeKegPayload() {
        return {
            name: this.name,
            key: this.key,
            nonce: this.nonce
        };
    }

    deserializeKegPayload(data) {
        this.name = data.name;
        this.key = data.key;
        this.nonce = data.nonce;
    }

    serializeProps() {
        return {
            fileId: this.fileId,
            size: this.size,
            ext: this.ext,
            uploadedAt: this.uploadedAt.valueOf()
        };
    }

    deserializeProps(props) {
        this.fileId = props.fileId;
        this.fileProcessingState = props.fileProcessingState;
        this.size = +props.size;
        this.ext = props.ext;
        this.uploadedAt = new Date(+props.uploadedAt);
    }


    upload(filePath) {
        // prevent invalid use
        if (this.uploading) throw new Error('Upload() call on file in uploading state');
        this.uploading = true;
        this.progress = 0;
        this.progressBuffer = 0;
        // preparing stream
        const chunkSize = 1024 * 256;
        const stream = new FileStreamAbstract.FileStream(filePath, 'read', chunkSize);
        const nonceGen = new FileNonceGenerator();
        // setting keg properties
        this.nonce = nonceGen.nonce;
        this.uploadedAt = new Date();
        this.name = fileHelper.getFileName(filePath);
        this.key = keys.generateEncryptionKey();
        this.fileId = util.getRandomFileId(User.current.username);

        return stream.open()
            .then(size => {
                console.log(`File read stream open. File size: ${size}`);
                this.size = size;
                return this.saveToServer();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    const maxChunkId = Math.ceil(this.size / chunkSize) - 1;
                    const uploader = new FileUploader(this, stream, nonceGen, maxChunkId, err => {
                        err ? reject(errors.normalize(err)) : resolve();
                    });
                    uploader.start();
                });
            })
            .finally(() => {
                this.uploading = false;
                this.progress = 0;
                this.progressBuffer = 0;
                stream && stream.close();
            });
    }


    static getByFileId(fileId) {

    }
}


module.exports = File;
