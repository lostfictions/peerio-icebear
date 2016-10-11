// @flow
/**
 * Peerio keg client
 * @module network/keg-client
 */

const socket = require('./socket');

class KegClient {
    kegDbId: string;

    constructor(kegDbId: string) {
        this.kegDbId = kegDbId;
    }

    get(kegId: string) {
        return socket.send('/auth/kegs/get',
        { collectionId: this.kegDbId, kegId })
            .then((keg: Object) => { // todo: don't be lazy and describe keg flow type
                keg.payload = JSON.parse(keg.payload);
                return keg;
            });
    }
}

module.exports = KegClient;
