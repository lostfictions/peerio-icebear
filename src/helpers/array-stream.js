/* eslint-disable no-param-reassign */
/**
 * Provides access to array of Uint8Array chunks of data in a stream fashion.
 * Currently supports only reading from stream.
 * Underlying array can receive new data by appending(pushing) chunks to it
 */
class ArrayStream {
    /**
     * @param {Array<Uint8Array>} array
     */
    constructor(array) {
        this.arr = array;
        this.pos = 0;
    }

    peek(size) {
        return this.read(size, false);
    }

    /**
     * Read a chunk from stream
     * @param {number} size - amount of bytes to read
     * @param {bool} adjust - default: true. Will remove read data from stream.
     * @returns {Uint8Array | null} - array or size or null if not enough data in the stream
     */
    read(size, adjust = true) {
        // do we have enough data for chunk this size?
        if (size > this.length) return null;

        const ret = new Uint8Array(size);
        let retpos = 0;
        // iterate chunks
        for (let i = 0; i < this.arr.length && size > retpos; i++) {
            const chunk = this.arr[i];
            // iterate bytes inside chunk
            for (let k = (i ? 0 : this.pos); k < chunk.length && size > retpos; k++) {
                ret[retpos++] = chunk[k];
            }
        }
        if (adjust) this._adjustPos(size);
        return ret;
    }

    // removes fully used chunks and adjusts position in the first chunk based on size of data read from stream
    _adjustPos(size) {
        // do we even need to remove any chunks?
        if ((this.arr[0].length - this.pos) > size) {
            this.pos += size;
            return;
        }
        // first chunk goes away for sure
        size -= this.arr[0].length - this.pos;
        this.arr.shift();
        this.pos = 0;
        while (size > 0) {
            if (size >= this.arr[0].length) {
                size -= this.arr[0].length;
                this.arr.shift();
            } else {
                this.pos = size;
                break;
            }
        }
    }

    /**
     * Current stream length (from currentDict position to the end of stream)
     * @returns {number} - available byte length
     */
    get length() {
        if (!this.arr.length) return 0;
        let ret = this.arr[0].length - this.pos;
        for (let i = 1; i < this.arr.length; i++) {
            ret += this.arr[i].length;
        }
        return ret;
    }
}

module.exports = ArrayStream;
