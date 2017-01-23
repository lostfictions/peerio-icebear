const { observable,computed, action } = require('mobx');
const contactStore = require('../stores/contact-store');
const socket = require('../../network/socket')();
const User = require('../user');
const Keg = require('./keg');
const cryptoUtil = require('../../crypto/util');
const keys = require('../../crypto/keys');
const publicCrypto = require('../../crypto/public');

class Ghost extends Keg {
    DEFAULT_GHOST_LIFESPAN = 259200; // 3 days

    @observable sending = false;
    @observable sendError = false;
    @observable subject = '';
    @observable recipients = observable.shallowArray([]);
    @observable files = observable.shallowArray([]);
    @observable passphrase = 'icebear'; //todo fill
    @observable timestamp = Date.now();
    @observable sent = false;

    get date() {
        return new Date(this.timestamp);
    }

    @computed get preview() {
        return this.body && this.body.length > 0 ? this.body.substring(0, 20) : '...';
    }

    get expiryDte() {
        return new Date(this.timestamp + (this.lifeSpanInSeconds * 1000));
    }

    get timeRemaining() {

    }

    /**
     *
     */
    constructor() {
        const db = User.current.kegdb;
        super(null, 'ghost', db);
        this.ghostId = cryptoUtil.getRandomFileId(User.current.username);
        this.version = 2;
    }

    /**
     * To be saved to kegs.
     *
     * @returns {Object}
     */
    serializeKegPayload() {
        return {
            ghostId: this.ghostId,
            subject: this.subject,
            passphrase: this.passphrase,
            recipients: this.recipients.slice(),
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files,
            body: this.body,
            timestamp: this.timestamp
        };
    }

    // serializeProps() {
    //     return {
    //
    //     }
    // }

    @action deserializeKegPayload(data) {
        console.log('ghost data', data)
        this.body = data.body;
        this.subject = data.subject;
        this.ghostId = data.ghostId;
        this.passphrase = data.passphrase;
        this.files = data.files; // FIXME
        this.timestamp = data.timestamp;
        this.recipients = data.recipients;
        this.sent = true;
    }

    @action deserializeProps(props) {
        console.log('ghost props', props);
    }

    /**
     *
     * @param text
     */
    send(text) {
        this.sending = true;
        this.sender = contactStore.getContact(User.current.username);
        this.body = text;
        this.timestamp = Date.now();
        this.lifeSpanInSeconds = this.DEFAULT_GHOST_LIFESPAN;

        console.log('send', this.subject)
        console.log('recipients', this.recipients.slice())

        // todo attach files properly
        return keys.deriveEphemeralKeys(this.ghostId, this.passphrase)
            .then((kp) => {
                this.keypair = kp;
                return this.encryptForEphemeralRecipient();
            })
            .then(() => this.sendGhost())
            .then(() => this.saveToServer())
            .then(() => {
                this.sent = true;
            })
            .catch(err => {
                this.sendError = true;
                console.error('Error sending message', err);
                return Promise.reject(err);
            })
            .finally(() => {
                this.sending = false;
            });
    }

    /**
     * Use ghost API to send ghost to external/ephemeral recipients.
     *
     * @returns {Promise}
     */
    sendGhost() {
        return socket.send('/auth/ghost/send', {
            ghostId: this.ghostId,
            ghostPublicKey: this.keypair.publicKey.buffer,
            recipients: this.recipients.slice(),
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: this.version,
            files:  [],         //// todo !!!! build files, include key
            body: this.asymEncryptedGhostBody.buffer
        });
    }

    /**
     * to be sent to ephemeral recipient, encrypted asymmetrically
     */
    serializeGhostPayload() {
        return {
            subject: this.subject,
            ghostId: this.ghostId,
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files,
            body: this.asymEncryptedGhostBody,
            timestamp: this.timestamp
        };
    }

    /**
     * Encrypt for the ephemeral keypair.
     *
     * @returns {*}
     */
    encryptForEphemeralRecipient() {
        try {
            const body = JSON.stringify(this.serializeGhostPayload());
            this.asymEncryptedGhostBody = publicCrypto.encrypt(
                cryptoUtil.strToBytes(body),
                this.keypair.publicKey,
                User.current.encryptionKeys.secretKey
            );
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Destroy the public-facing ghost.
     * @returns {Promise}
     */
    revoke() {
        return socket.send('/auth/ghost/delete', { ghostId: this.ghostId });
    }


}

module.exports = Ghost;
