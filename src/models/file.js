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
    @observable name = '';
    @observable ext ='';
    @observable size = 0;
    @observable uploadedAt = null;

    serializeKegPayload() {
        return {
            name: this.name,
            key: this.key
        };
    }

    deserializeKegPayload(data) {
        this.name = data.name;
        this.key = data.key;
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
        this.uploading = true;
        this.progress = 0;

        this.uploadedAt = new Date();
        this.name = fileHelper.getFileName(filePath);
        this.key = keys.generateEncryptionKey();
        this.fileId = util.getRandomFileId(User.current.username);
        const chunkSize = 1024 * 512;
        const stream = new FileStreamAbstract.FileStream(filePath, 'read', chunkSize);
        return stream.open()
            .then(size => {
                this.size = size;
                return this.saveToServer();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    this.uploadChunk(stream, 0, Math.ceil(this.size / chunkSize) - 1, err => {
                        if (err) reject(errors.normalize(err));
                        else resolve();
                    });
                });
            })
            .finally(() => {
                this.uploading = false;
                this.progress = 0;
            });
    }

    uploadChunk(stream, chunkNum, maxChunkNum, callback) {
        this.progress = maxChunkNum > 0 ? Math.min(100, Math.floor(chunkNum / (maxChunkNum / 100))) : 0;
        stream.read()
            .then(bytesRead => {
                if (bytesRead === 0) {
                    if (chunkNum - 1 !== maxChunkNum) {
                        callback(new Error(
                            'Stream reader returned 0 bytes,' +
                            `but last uploaded chunk is ${chunkNum - 1}/${maxChunkNum}`));
                    } else callback();
                    return;
                }
                let buffer = stream.buffer;
                if (bytesRead !== buffer.length) {
                    buffer = buffer.slice(0, bytesRead);
                }
                const sendBuffer = secret.encrypt(buffer, this.key);
                socket.send('/auth/dev/file/upload-chunk', {
                    fileId: this.fileId,
                    chunkNum,
                    chunk: sendBuffer.buffer,
                    last: chunkNum === maxChunkNum
                }).then(() => this.uploadChunk(stream, chunkNum + 1, maxChunkNum, callback));
            })
            .catch(err => callback(err || new Error('Unknown error: Failed to upload file.')));
    }


    static getByFileId(fileId) {

    }
}


module.exports = File;
