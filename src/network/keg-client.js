// @flow
/**
 * Peerio keg client
 * @module network/keg-client
 */

const socket = require('./socket');
const util = require('../crypto/util');

class KegClient {
    kegDbId: string;

    constructor(kegDbId: string) {
        this.kegDbId = kegDbId;
    }

    get(kegId: string) {
        return socket.send('/auth/kegs/get', { collectionId: this.kegDbId, kegId })
                     .then((keg: Object) => { // todo: don't be lazy and describe keg flow type
                         keg.payload = JSON.parse(keg.payload);
                         return keg;
                     });
    }

    update(kegId: string, type: string, version: number, payload: Object) {
        return socket.send('/auth/kegs/update', {
            collectionId: this.kegDbId,
            update: {
                kegId,
                keyId: '0',
                type,
                // todo: unstringify when server is deployed
                payload: payload instanceof Uint8Array ? util.bytesToB64(payload) : JSON.stringify(payload),
                version,
                collectionVersion: 0// todo: remove when server does
            }
        });
    }

}

module.exports = KegClient;
