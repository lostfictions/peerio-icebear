const { observable, computed, action } = require('mobx');
const _ = require('lodash');
const contactStore = require('./stores/contact-store');
const fileStore = require('./stores/file-store');
const socket = require('../network/socket');
const Keg = require('./kegs/keg');
const { cryptoUtil, sign, secret } = require('../crypto/index');
const keys = require('../crypto/keys');
const User = require('./user');
const PhraseDictionaryCollection = require('./phrase-dictionary');
const config = require('../config');

class Ghost extends Keg {
    DEFAULT_GHOST_LIFESPAN = 259200; // 3 days
    DEFAULT_GHOST_PASSPHRASE_LENGTH = 5;

    @observable sending = false;
    @observable sendError = false;
    @observable subject = '';
    @observable recipients = observable.shallowArray([]);
    @observable files = observable.shallowArray([]);
    @observable passphrase = '';
    @observable timestamp = Date.now();
    @observable sent = false;
    @observable lifeSpanInSeconds = 0;

    get date() {
        return new Date(this.timestamp);
    }

    @computed get preview() {
        return this.body && this.body.length > 0 ? this.body.substring(0, 20) : '...';
    }

    @computed get url() {
        return `${config.ghostFrontendUrl}?${this.ghostId}`;
    }

    @computed get expiryDate() {
        return new Date(this.timestamp + (this.lifeSpanInSeconds * 1000));
    }

    @computed get fileCounter() {
        return this.files.length;
    }

    @computed get expired() {
        return this.timestamp + (this.lifeSpanInSeconds * 1000) < Date.now();
    }

    /**
     * Constructor.
     *
     * NOTE: ghost IDs are in hex for browser compatibility.
     */
    constructor() {
        const db = User.current.kegDb;
        super(null, 'ghost', db);
        this.version = 2;
        this.passphrase = PhraseDictionaryCollection.current.getPassphrase(this.DEFAULT_GHOST_PASSPHRASE_LENGTH);
        // encode user-specific ID in hex
        this.ghostId = cryptoUtil.getRandomUserSpecificIdHex(User.current.username);
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
            files: this.files.slice(),
            body: this.body,
            timestamp: this.timestamp
        };
    }

    /**
     * Load existing (sent) ghost from keg storage.
     *
     * @param {Object} data
     */
    @action deserializeKegPayload(data) {
        this.body = data.body;
        this.subject = data.subject;
        this.ghostId = data.ghostId;
        this.passphrase = data.passphrase;
        this.files = data.files;
        this.timestamp = data.timestamp;
        this.recipients = data.recipients;
        this.sent = true;
        this.lifeSpanInSeconds = data.lifeSpanInSeconds;
    }

    /**
     * Send a ghost.
     *
     * @param {String} text - message content
     */
    send(text) {
        this.sending = true;
        this.sender = contactStore.getContact(User.current.username);
        this.body = text;
        this.timestamp = Date.now();
        this.lifeSpanInSeconds = this.DEFAULT_GHOST_LIFESPAN;

        return keys.deriveEphemeralKeys(cryptoUtil.hexToBytes(this.ghostId), this.passphrase)
            .then((kp) => {
                console.log('ghost public key', cryptoUtil.bytesToB64(kp.publicKey));
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
                console.error('Error sending ghost', err);
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
            signature: this.ghostSignature,
            ghostPublicKey: this.keypair.publicKey.buffer,
            recipients: this.recipients.slice(),
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            version: this.version,
            files: this.files.slice(),
            body: this.asymEncryptedGhostBody.buffer
        });
    }

    /**
     * to be sent to ephemeral recipient, encrypted asymmetrically
     */
    serializeGhostPayload() {
        return {
            subject: this.subject,
            username: User.current.username,
            firstName: User.current.firstName,
            lastName: User.current.lastName,
            ghostId: this.ghostId,
            lifeSpanInSeconds: this.lifeSpanInSeconds,
            signingPublicKey: cryptoUtil.bytesToB64(User.current.signKeys.publicKey),
            version: 2,
            body: this.body,
            files: _.map(this.files, (fileId) => {
                const file = fileStore.getById(fileId);
                return _.assign({}, file.serializeProps(), file.serializeKegPayload());
            }),
            timestamp: this.timestamp
        };
    }

    /**
     * Encrypt for the ephemeral keypair and signs the ciphertext.
     *
     * @returns {*}
     */
    encryptForEphemeralRecipient() {
        try {
            const body = JSON.stringify(this.serializeGhostPayload());
            this.asymEncryptedGhostBody = secret.encryptString(
                body,
                User.current.getSharedKey(this.keypair.publicKey)
            );
            const s = sign.signDetached(this.asymEncryptedGhostBody, User.current.signKeys.secretKey);
            this.ghostSignature = cryptoUtil.bytesToB64(s);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Attaches files.
     *
     * @param {Array<File>} files
     */
    attachFiles(files) {
        this.files.clear();
        if (!files || !files.length) return null;
        files.forEach((file) => {
            this.files.push(file.fileId);
        });
        return files.slice();
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
