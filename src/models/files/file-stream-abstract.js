/* eslint-disable no-unused-vars */
const { AbstractCallError } = require('../../errors');

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
     */
    constructor(filePath, mode) {
        this.filePath = filePath;
        if (mode !== 'read' && mode !== 'write' && mode !== 'append') {
            throw new Error('Invalid stream mode.');
        }
        this.mode = mode;
        this.pos = 0;
    }

    /**
     * Reads a chunk of data from file stream
     * @param {number} size - amount of bytes to read (if possible)
     * @return {Promise<Uint8Array>} - resolves with a number of bytes written to buffer
     */
    read = (size) => {
        if (this.mode !== 'read') {
            return Promise.reject(new Error('Attempt to read from write stream.'));
        }
        return this.readInternal(size).then(this._increasePosition);
    };

    _increasePosition = (buf) => {
        this.pos += buf.length;
        return buf;
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
        this._increasePosition(buffer);
        if (!buffer || !buffer.length) return Promise.resolve();
        return this.writeInternal(buffer).then(this._increasePosition);
    };

    writeInternal(buffer) {
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
     * This function has to set 'size' property
     * @returns {Promise<FileStreamAbstract>} - this
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
     * @param {string} name - normalized file name (deterministically generated)
     * @returns {string} - actual device path for file
     */
    static getFullPath(name) {
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

    static getStat(path) {
        throw new AbstractCallError();
    }

    /**
     * @returns Promise<string[]> - array of absolute paths to cache items
     */
    static getCacheList() {
        throw new AbstractCallError();
    }

    static delete(path) {
        throw new AbstractCallError();
    }

}

module.exports = FileStreamAbstract;
