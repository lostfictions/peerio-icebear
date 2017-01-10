/* eslint-disable no-unused-vars */
const { AbstractCallError } = require('../errors');
const db = require('../db/tiny-db');

/**
 * Abstract File Stream class
 *  1. inherit you own
 *  2. override required functions
 *  3. set FileStreamAbstract.FileStream = YourFileStreamImplementation
 */
class FileStreamAbstract {

    /**
     * @param {string} filePath - will be used by 'open' function
     * @param {string} mode - 'read' or 'write' or 'append'
     * @param {number} bufferSize
     */
    constructor(filePath, mode, bufferSize = 1024 * 512) {
        this.filePath = filePath;
        if (mode !== 'read' && mode !== 'write' && mode !== 'append') {
            throw new Error('Invalid stream mode.');
        }
        if (mode === 'read') {
            // when reading file, we are going to reuse the same buffer
            this.buffer = new Uint8Array(bufferSize);
        }
        this.mode = mode;
    }

    /**
     * Reads a chunk of data from file stream
     * @return {Promise<number>} - resolves with a number of bytes written to buffer
     */
    read = () => {
        if (this.mode !== 'read') {
            return Promise.reject(new Error('Attempt to read from write stream.'));
        }
        return this.readInternal();
    };

    readInternal() {
        throw new AbstractCallError();
    }

    /**
     * Writes a chunk of data to file stream
     * @param {Uint8Array} buffer
     * @returns {Promise} - resolves when chunk is written out,
     */
    write = (buffer) => {
        if (this.mode !== 'write' && this.mode !== 'append') {
            return Promise.reject(new Error(`file-stream.js: Attempt to write to read stream. ${this.mode}`));
        }
        if (!buffer || !buffer.length) return Promise.resolve();
        return this.writeInternal(buffer);
    };

    // eslint-disable-next-line
    writeInternal(buffer, offset) {
        throw new AbstractCallError();
    }

    /**
     * Move file position pointer
     * @param {number} pos
     * @returns {number} new position immediately
     */
    seek = (pos) => {
        if (this.mode !== 'read') throw new Error('Seek only on read streams');
        return this.seekInternal(pos);
    };

    /**
     * Move file position pointer
     * @param {number} pos
     */
    // eslint-disable-next-line
    seekInternal(pos) {
        throw new AbstractCallError();
    }

    /**
     * @param {number} pos - current download/upload position. download or upload is determined by FS mode
     * @returns {Promise} - resolves when position was saved in local storage
     */
    static savePosition(mode, path, pos) {
        const key = `cache::${mode}::${path}`;
        // console.log(`file-stream.js: saving ${key}, ${pos}`);
        return pos ?
            db.set(key, pos)
            : db.remove(key);
    }

    /**
     * @returns {Promise} - resolves with cached position or 0
     */
    static loadPosition(mode, path) {
        const key = `cache::${mode}::${path}`;
        return db.get(key).then(pos => {
            // console.log(`file-stream.js: loading ${key}`);
            console.log(pos);
            return pos;
        });
    }

    /**
     * @returns {Promise<number>} - resolves with file size when file is open and ready for reading/writing
     */
    open() {
        throw new AbstractCallError();
    }

    /**
     * Called when done working with file, should flush all buffers and dispose resources.
     */
    close() {
        throw new AbstractCallError();
    }

    /**
     * @param {string} name - file name
     * @returns {string} - actual device path for file
     */
    static cachePath(name) {
        throw new AbstractCallError();
    }

    /**
     * @param {string} path
     * @returns Promise<boolean> - true if path exists on device
     */
    static exists(path) {
        throw new AbstractCallError();
    }

    /**
     * Launch external viewer
     * @param {string} path - file path to open in a viewer
     */
    static launchViewer(path) {
        throw new AbstractCallError();
    }

    // Set implementation from client app code
    static FileStream = null;
}

module.exports = FileStreamAbstract;
