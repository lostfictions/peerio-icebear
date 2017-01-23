const { AbstractCallError } = require('../errors');
const { when } = require('mobx');
const socket = require('../network/socket')();

class FileResumableAbstract {
    _tick() {
        throw new AbstractCallError();
    }

    _abortChunkUpload() {
        throw new AbstractCallError();
    }

    _checkTimeout = (clear) => {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (clear) return;
        this._timeout = setTimeout(() => {
            console.error(`file-resumable-abstract.js: timeout. aborting`);
            this._abortChunkUpload();
            this._retryLastChunk();
        }, 10000);
    };

    _retryLastChunk = () => {
        console.log('file-resumable-abstract.js: trying to download the chunk again');
        // reset to the last successful chunk
        this.pos = this.lastPos;
        when(() => socket.authenticated, () => {
            console.log('file-resumable-abstract.js: socket authenticated');
            this._tick();
        });
    };
}

module.exports = FileResumableAbstract;
