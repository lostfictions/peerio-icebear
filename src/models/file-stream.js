const { AbstractCallError } = require('../errors');
/**
 * Abstract File Stream class, inherit you own, override following functions
 * - open()
 * - close()
 * - readInternal()
 * - writeInternal()
 */
class FileStreamAbstract {

    /**
     * @param {string} filePath - will be used by 'open' function
     * @param {string} mode - 'read' or 'write'
     */
    constructor(filePath, mode) {
        this.filePath = filePath;
        if (mode !== 'read' && mode !== 'write') {
            throw new Error('Invalid stream mode.');
        }
        this.mode = mode;
    }

    /**
     * Reads a chunk of data from file stream
     * @param {number} size - amount of bytes to read from stream (can return less in case of reaching EOF)
     * @return {Promise<Uint8Array>} - resolves with chunk of data or null in case of EOF
     */
    read(size) {
        if (this.mode !== 'read') return Promise.reject(new Error('Attempt to read from write stream.'));
        if (size <= 0) return Promise.reject(new Error('FileStream.read(): Invalid size. '));
        return this.readInternal(size);
    }

    readInternal(size) {
        throw new AbstractCallError();
    }

    /**
     * Writes a chunk of data to file stream
     * @param {Uint8Array} bytes
     * @returns {Promise} - resolves when chunk is written out
     */
    write(bytes) {
        if (this.mode !== 'write') return Promise.reject(new Error('Attempt to write to read stream.'));
        if (!bytes || !bytes.length) return Promise.resolve();
        return this.writeInternal(bytes);
    }

    writeInternal(bytes) {
        throw new AbstractCallError();
    }

    /**
     * @returns {Promise} - resolves when file is open and ready for reading/writing
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

}

module.exports = FileStreamAbstract;
