'use strict';

const errors = require('../../errors');
const cryptoUtil = require('../../crypto/util');

/**
 * Abstract parent class for FileDownloader and FileUploader
 * @param {File} file
 * @param {FileStreamAbstract} stream
 * @param {FileNonceGenerator} nonceGenerator
 * @param {string} processType - 'upload' or 'download'
 * @protected
 */
let FileProcessor = class FileProcessor {
    constructor(file, stream, nonceGenerator, processType) {
        this.stopped = false;
        this.processFinished = false;

        this._error = err => {
            this._finishProcess(err || new Error(`${this.processType} failed`));
        };

        this.file = file;
        this.fileKey = cryptoUtil.b64ToBytes(file.key);
        this.stream = stream;
        this.nonceGenerator = nonceGenerator;
        this.processType = processType;
    }

    /**
     * Next queue processing calls will stop if stopped == true
     * @member {boolean}
     * @protected
     */


    /**
     * process stopped and promise resolved/rejected
     * @member {boolean}
     * @protected
     */


    /**
     * Starts the up/download process
     * @returns {Promise}
     * @protected
     */
    start() {
        console.log(`starting ${this.processType} for file id: ${this.file.id}`);
        this._tick();
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    /**
     * Cancels process.
     * @protected
     */
    cancel() {
        this._finishProcess(new errors.UserCancelError(`${this.processType} cancelled`));
    }

    // stops process and resolves or rejects promise
    _finishProcess(err) {
        if (this.processFinished) return;
        this.processFinished = true;
        this.stopped = true; // bcs in case of error some calls might be scheduled
        try {
            this.stream.close();
        } catch (e) {
            // really don't care
        }
        this.cleanup();
        if (err) {
            console.log(`Failed to ${this.processType} file ${this.file.fileId}.`, err);
            this.reject(errors.normalize(err));
            return;
        }
        console.log(`${this.processType} success: ${this.file.fileId}`, this.toString());
        this.resolve();
    }

    // shortcut to finish process with error


    /**
     * Override in child classes if cleanup is needed on finish.
     * @abstract
     * @protected
     */
    cleanup() {}
};


module.exports = FileProcessor;