const { observable } = require('mobx');
const contactStore = require('../contact-store');
const socket = require('../../network/socket');
const User = require('../user');
const Keg = require('./keg');
const cryptoUtil = require('../../crypto/util');
const keys = require('../../crypto/keys');
const publicCrypto = require('../../crypto/public');

class Ghost extends Keg {
    @observable sending = false;
    @observable sendError = false;

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
            ghostPublicKey: this.keypair.publicKey,
            recipients: this.recipients,
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files,
            body: this.encryptedBody,
            timestamp: this.timestamp
        };
    }

    /**
     * to be sent to ephemeral recipient.
     */
    serializeGhostPayload() {
        return {
            ghostId: this.ghostId,
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: 2,
            files: this.files,   // todo build files, include key
            body: this.encryptedBody,
            timestamp: this.timestamp
        };
    }

    send(recipients, text, files, passphrase) {
        this.sending = true;
        this.sender = contactStore.getContact(User.current.username);
        this.recipients = recipients;
        this.text = text;
        this.timestamp = new Date();
        this.lifeSpanInSeconds = 60 * 60 * 1000;
        this.passphrase = passphrase;
        this.files = files;
        this.keypair = keys.deriveEphemeralKeys(this.ghostId, this.passphrase);


        // todo attach files properly

        return this.encryptForEphemeralRecipient()
            .then(() => this.sendGhost())
            .then(() => this.saveToServer())
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
            ghostPublicKey: this.keypair.publicKey,
            recipients: this.recipients,
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: this.version,
            files: this.files,
            body: this.encryptForEphemeralRecipient()
        });
    }

    /**
     * Encrypt for the ephemeral keypair.
     *
     * @returns {*}
     */
    encryptForEphemeralRecipient() {
        try {
            this.encryptedBody = publicCrypto.encrypt(
                this.serializeGhostPayload(),
                this.keypair.publicKey,
                User.current.encryptionKeys.secretKey
            );
            return Promise.resolve();
        } catch(e) {
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

module.exports = Message;
