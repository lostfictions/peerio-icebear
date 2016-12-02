const Keg = require('./kegs/keg');
const { observable, autorun, computed } = require('mobx');
const FileStreamAbstract = require('./file-stream');
const keys = require('../crypto/keys');
const cryptoUtil = require('../crypto/util');
const User = require('./user');
const fileHelper = require('../helpers/file');
const errors = require('../errors');
const FileUploader = require('./file-uploader');
const FileDownloader = require('./file-downloader');
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
        if (this.uploading || this.downloading) return Promise.reject();
        this.uploading = true;
        this.progress = 0;
        this.progressBuffer = 0;
        // preparing stream
        const chunkSize = 1024 * 512;
        const stream = new FileStreamAbstract.FileStream(filePath, 'read', chunkSize);
        const nonceGen = new FileNonceGenerator();
        // setting keg properties
        this.nonce = cryptoUtil.bytesToB64(nonceGen.nonce);
        this.uploadedAt = new Date();
        this.name = fileHelper.getFileName(filePath);
        this.key = cryptoUtil.bytesToB64(keys.generateEncryptionKey());
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

    download(filePath) {
        if (this.downloading || this.uploading) return Promise.reject();
        this.downloading = true;
        this.progress = 0;
        this.progressBuffer = 0;
        const nonceGen = new FileNonceGenerator(cryptoUtil.b64ToBytes(this.nonce));
        const stream = new FileStreamAbstract.FileStream(filePath, 'write');
        return stream.open()
            .then(() => {
                console.log(`File write stream open.`);
                return new Promise((resolve, reject) => {
                    this.downloader = new FileDownloader(this, stream, nonceGen, err => {
                        err ? reject(errors.normalize(err)) : resolve();
                    });
                    this.downloader.start();
                });
            }).finally(() => {
                this.downloading = false;
                this.progress = 0;
                this.progressBuffer = 0;
                this.downloader = null;
                stream && stream.close();
            });
    }

    cancelDownload() {
        if (this.downloader) this.downloader.cancel();
    }
}


module.exports = File;
