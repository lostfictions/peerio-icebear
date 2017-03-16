const Keg = require('./../kegs/keg');
const { AntiTamperError } = require('../../errors');
const socket = require('../../network/socket');
const { getUser } = require('../../helpers/di-current-user');

class Tofu extends Keg {
    username;
    firstName;
    lastName;
    encryptionPublicKey;
    signingPublicKey;

    constructor(db) {
        super(null, 'tofu', db);
    }

    serializeKegPayload() {
        return {
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            encryptionPublicKey: this.encryptionPublicKey,
            signingPublicKey: this.signingPublicKey
        };
    }

    deserializeKegPayload(payload) {
        this.firstName = payload.firstName;
        this.lastName = payload.lastName;
        this.encryptionPublicKey = payload.encryptionPublicKey;
        this.signingPublicKey = payload.signingPublicKey;
    }

    serializeProps() {
        return {
            username: this.username
        };
    }

    deserializeProps(props) {
        this.username = props.username;
    }

    detectTampering(payload) {
        super.detectTampering(payload);
        if (payload.username !== this.username) {
            throw new AntiTamperError('Tofu keg inner and outer username mismatch. '
                + `Inner: ${payload.username}. Outer: ${this.username}`);
        }
    }
    static getByUsername(username) {
        return socket.send('/auth/kegs/query', {
            collectionId: 'SELF',
            minCollectionVersion: 0,
            query: { type: 'tofu', username }
        }).then(res => {
            if (!res.length) return null;
            const keg = new Tofu(getUser().kegDb);
            keg.loadFromKeg(res[0]);
            return keg;
        });
    }
}

module.exports = Tofu;
