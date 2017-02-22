/**
 * Configuration module.
 * Exists just to collect most of the app configuration aspects in one place.
 * ! Is not supposed be edited at runtime !
 * @module config
 */

class UploadConfig {
    get chunkSizes() {
        return [
            // up to ~10Mb file
            { maxFileSize: 192 * 1024 * 54, chunkSize: 192 * 1024 },
            // up to ~25Mb file
            { maxFileSize: 256 * 1024 * 100, chunkSize: 256 * 1024 },
            // up to ~50Mb file
            { maxFileSize: 384 * 1024 * 134, chunkSize: 384 * 1024 },
            // up to ~250Mb file
            { maxFileSize: 512 * 1024 * 300, chunkSize: 512 * 1024 },
            // above 250Mb
            { maxFileSize: null, chunkSize: 768 * 1024 }
        ];
    }

    // eslint-disable-next-line consistent-return
    getChunkSize(fileSize) {
        const data = this.chunkSizes;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row.maxFileSize === null) return row.chunkSize;
            if (fileSize > row.maxFileSize) continue;
            return row.chunkSize;
        }
    }

    encryptBufferSize = 1024 * 1024; // max amount of bytes to pre-buffer for encrypting
    uploadBufferSize = 1024 * 1024; // max amount of chunks to pre-encrypt for sending
    maxResponseQueue = 2; // max amount of uploaded chunks waiting for server response

}

const config = new class {
    // -- development only
    debug = {
        trafficReportInterval: 60000,
        socketLogEnabled: false
    };
    //-------------------
    termsUrl = 'https://github.com/PeerioTechnologies/peerio-documentation/blob/master/Terms_of_Use.md';
    supportUrl = 'https://peerio.zendesk.com';

    socketServerUrl = 'wss://';
    ghostFrontendUrl = 'https://';

    upload = new UploadConfig();
    // Numbers below are an approximate maximum, download logic will detect the exact number based on
    // chunk size and will make sure it does not exceed this number. Same is applied to upload buffers.
    // WARNING: sizes have to be >= max possible upload chunk size
    download = {
        maxDownloadChunkSize: 1024 * 1024, // max amount of bytes to download at once for further processing
        maxDecryptBufferSize: 1024 * 1024 * 3  // max amount of bytes to download and queue for decrypt
    };

    // -- client-specific implementations should be provided
    FileStream = null;
    StorageEngine = null;
    observableClockEventFrequency = 30; // seconds
}();


module.exports = config;
