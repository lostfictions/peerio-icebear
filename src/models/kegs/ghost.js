const { observable,computed, asFlat } = require('mobx');
const contactStore = require('../stores/contact-store');
const socket = require('../../network/socket')();
const User = require('../user');
const Keg = require('./keg');
const cryptoUtil = require('../../crypto/util');
const keys = require('../../crypto/keys');
const publicCrypto = require('../../crypto/public');

class Ghost extends Keg {
    @observable sending = false;
    @observable sendError = false;
    @observable subject = '';
    @observable recipients = asFlat([]);
    @observable files = asFlat([]);
    @observable passphrase = 'icebear'; //todo fill

    get preview() {
        return this.text && this.text.length > 0 ? this.text.substr(0, 20): '...';
    }

    /**
     *
     */
    constructor() {
        const db = User.current.kegdb;
        super(null, 'ghost', db);
        this.sent = false;
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
            ghostPublicKey: this.keypair.publicKey,
            recipients: this.recipients.slice(),
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files,
            body: this.asymEncryptedGhostBody,
            timestamp: this.timestamp
        };
    }

    /**
     * to be sent to ephemeral recipient.
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

    send(text) {
        this.sending = true;
        this.sender = contactStore.getContact(User.current.username);
        this.text = text;
        this.timestamp = new Date();
        this.lifeSpanInSeconds = 864000;

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
     * Encrypt for the ephemeral keypair.
     *
     * @returns {*}
     */
    encryptForEphemeralRecipient() {
        try {
            const body = JSON.stringify(this.serializeGhostPayload());
            console.log('encrypt', body);
            console.log('their key', this.keypair.publicKey);
            console.log('my key', User.current.encryptionKeys.secretKey)
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
