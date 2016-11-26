const Keg = require('./kegs/keg');
const { observable, autorun, computed } = require('mobx');
const FileStreamAbstract = require('./file-stream');
const keys = require('../crypto/keys');
const cryptoUtil = require('../crypto/util');
const User = require('./user');
const fileHelper = require('../helpers/file');
const errors = require('../errors');
const FileUploader = require('./file-uploader');
const FileNonceGenerator = require('./file-nonce-generator');
const util = require('../util');

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
    @observable readyForDownload = false;
    @observable uploading = false;
    @observable downloading = false;
    @observable progress = 0;
    @observable progressBuffer = 0;
    @observable name = '';
    @observable ext ='';
    @observable size = 0;
    @observable uploadedAt = null;

    @computed get sizeFormatted() {
        return util.formatBytes(this.size);
    }

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
        this.readyForDownload = props.fileProcessingState === 'ready';
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
        this.fileId = cryptoUtil.getRandomFileId(User.current.username);

        return stream.open()
            .then(size => {
                console.log(`File read stream open. File size: ${size}`);
                this.size = size;
                return this.saveToServer();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    const maxChunkId = Math.ceil(this.size / chunkSize) - 1;
                    this.uploader = new FileUploader(this, stream, nonceGen, maxChunkId, err => {
                     //   this.uploading = false;
                        err ? reject(errors.normalize(err)) : resolve();
                    });
                    this.uploader.start();
                });
            })
            .finally(() => {
                this.uploading = false;
                this.progress = 0;
                this.progressBuffer = 0;
                this.uploader = null;
                stream && stream.close();
            });
    }

    cancelUpload() {
        if (this.uploader) this.uploader.cancel();
    }


    static getByFileId(fileId) {

    }
}


module.exports = File;
