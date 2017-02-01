/**
 * Base class for kegs
 * @module models/keg
 */
const socket = require('../../network/socket');
const { secret, sign, cryptoUtil } = require('../../crypto');
const { AntiTamperError } = require('../../errors');
const { observable } = require('mobx');
const { getContactStore } = require('../../helpers/di-contact-store');
const { getUser } = require('../../helpers/di-current-user');

let temporaryKegId = 0;
function getTemporaryKegId() {
    return `tempKegId_${temporaryKegId++}`;
}
/**
 * Base class with common metadata and operations.
 */
class Keg {

    @observable signatureError = null;// true/false/null are the valid values
    @observable sharedKegError = null;
    /**
     * @param {[string]} id - kegId, or null for new kegs
     * @param {string} type - keg type
     * @param {KegDb} db - keg database owning this keg
     * @param {[boolean]} plaintext - should keg be encrypted
     */
    constructor(id, type, db, plaintext) {
        this.id = id;
        this.type = type;
        this.db = db;
        this.plaintext = !!plaintext;
        this.keyId = 0; // @type {string} reserved for future keys change feature
        this.overrideKey = null; // @type {[Uint8Array]} separate key for this keg, overrides regular keg key
        this.version = 0; // @type {number} keg version
        this.collectionVersion = 0; // @type {number} kegType-wide last update id for this keg
        this.props = {};
    }

    /**
     * Kegs with version==1 were just created and don't have any data
     * @returns {boolean}
     */
    get isEmpty() {
        return this.version === 1;
    }

    assignTemporaryId() {
        this.tempId = getTemporaryKegId();
    }

    /**
     * Saves keg to server, creates keg (reserves id) first if needed
     * @returns {Promise<Keg>}
     */
    saveToServer(cleanShareData) {
        console.log('save to server');
        if (this.id) return this._internalSave(cleanShareData);

        return socket.send('/auth/kegs/create', {
            collectionId: this.db.id,
            type: this.type
        }).then(resp => {
            console.log('saved to server', resp);
            this.id = resp.kegId;
            this.version = resp.version;
            this.collectionVersion = resp.collectionVersion;
            return this._internalSave(cleanShareData);
        });
    }

    /**
     * Updates existing server keg with new data.
     * This function assumes keg id exists so always use 'saveToServer()' to be safe.
     * todo: reconcile optimistic concurrency failures
     * @returns {Promise}
     * @private
     */
    _internalSave(cleanShareData) {
        let payload, props;
        try {
            payload = this.serializeKegPayload();
            props = this.serializeProps();
            if (cleanShareData) {
                props.sharedKegSenderPK = null;
                props.sharedKegRecipientPK = null;
                props.sharedKegReencrypted = 'true';
            }
            // anti-tamper protection, we do it here, so we don't have to remember to do it somewhere else
            if (!this.plaintext) {
                payload._sys = {
                    kegId: this.id,
                    type: this.type
                };
            }
            // server expects string or binary
            payload = JSON.stringify(payload);
            // should we encrypt the string?
            if (!this.plaintext) {
                payload = secret.encryptString(payload, this.overrideKey || this.db.key);
                if (this.db.id !== 'SELF') {
                    props.signature = this._signKegPayload(payload); // here we need Uint8Array
                    this.signatureError = false;
                }
                payload = payload.buffer; // socket accepts ArrayBuffer
            }
        } catch (err) {
            console.error('Fail preparing keg to save.', err);
            return Promise.reject(err);
        }
        return socket.send('/auth/kegs/update', {
            collectionId: this.db.id,
            update: {
                kegId: this.id,
                keyId: '0',
                type: this.type,
                payload,
                props,
                // todo: this should be done smarter when we have save retry, keg edit and reconcile
                version: ++this.version
            }
        }).then(resp => {
            this.collectionVersion = resp.collectionVersion;
        });
    }

    /**
     * Sign the encrypted payload of this keg
     * @param {Uint8Array} payload
     * @returns {String} base64
     * @private
     */
    _signKegPayload(payload) {
        let signed = sign.signDetached(payload, getUser().signKeys.secretKey);
        signed = cryptoUtil.bytesToB64(signed);
        return signed;
    }

    /**
     * Populates this keg instance with data from server
     * @returns {Promise.<Keg>}
     */
    load() {
        return socket.send('/auth/kegs/get', {
            collectionId: this.db.id,
            kegId: this.id
        }).then(keg => this.loadFromKeg(keg));
    }

    remove() {
        return socket.send('/auth/kegs/delete', {
            collectionId: this.db.id,
            kegId: this.id
        });
    }

    /**
     * Synchronous function to rehydrate current Keg instance with data from server.
     * @param {Object} keg as stored on server
     * @returns {Keg|Boolean}
     */
    loadFromKeg(keg) {
        try {
            if (this.id && this.id !== keg.kegId) {
                console.error(`Attempt to rehydrate keg(${this.id}) with data from another keg(${keg.kegId}).`);
                return false;
            }
            this.id = keg.kegId;
            this.version = keg.version;
            this.owner = keg.owner;
            this.deleted = keg.deleted;
            this.collectionVersion = keg.collectionVersion;
            this.deserializeProps(keg.props);
            //  is this an empty keg? probably just created.
            if (!keg.payload) return this;
            let payload = keg.payload;
            let sharedKey = null;
            // should we decrypt?
            if (!this.plaintext) {
                payload = new Uint8Array(keg.payload);
                // SELF kegs do not require signing
                if (this.db.id !== 'SELF') {
                    this._verifyKegSignature(payload, keg.props.signature);
                }
                // is this keg shared with us and needs re-encryption?
                if (keg.props.sharedBy && !keg.props.sharedKegReencrypted) {
                    // async call, changes state of the keg in case of issues
                    this._validateAndReEncryptSharedKeg(keg.props);
                    // todo: when we have key change, this should use secret key corresponding to sharedKegRecipientPK
                    sharedKey = getUser().getSharedKey(cryptoUtil.b64ToBytes(keg.props.sharedKegSenderPK));
                }
                payload = secret.decryptString(payload, sharedKey || this.overrideKey || this.db.key);
            }
            payload = JSON.parse(payload);
            if (!(this.plaintext || (keg.props.sharedBy && !keg.props.sharedKegReencrypted))) {
                this.detectTampering(payload);
            }
            this.deserializeKegPayload(payload);
            return this;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    _validateAndReEncryptSharedKeg(kegProps) {
        // we need to make sure that sender's public key really belongs to him
        const contact = getContactStore().getContact(kegProps.sharedBy);
        contact.whenLoaded(() => {
            if (cryptoUtil.bytesToB64(contact.encryptionPublicKey) !== kegProps.sharedKegSenderPK) {
                this.sharedKegError = true;
                return;
            }
            this.saveToServer(true);
        });
    }

    /**
     *
     * @param {Uint8Array} payload
     * @param {String} signature
     * @private
     */
    _verifyKegSignature(payload, signature) {
        if (!payload) return;
        if (!signature) {
            this.signatureError = true;
            return;
        }
        signature = cryptoUtil.b64ToBytes(signature); // eslint-disable-line no-param-reassign
        const contact = getContactStore().getContact(this.owner);
        contact.whenLoaded(() => {
            this.signatureError = contact.notFound
                || !sign.verifyDetached(payload, signature, contact.signingPublicKey);
        });
    }

    /**
     * Generic version that provides empty keg payload.
     * Override in child classes to.
     */
    serializeKegPayload() {
        return {};
    }

    /**
     * Generic version that does nothing..
     * Override in child classes to convert raw keg data into object properties.
     */
    //eslint-disable-next-line
    deserializeKegPayload(payload) {}

    /**
     * Generic version that uses this.props object as-is
     * @returns {Object}
     */
    serializeProps() {
        return this.props || {};
    }

    /**
     * Generic version that puts props object as-is to this.prop
     * @param {Object} props
     */
    deserializeProps(props) {
        this.props = props;
    }


    /**
     * Compares keg metadata with encrypted payload to make sure server didn't change metadata.
     * @param payload {Object} - decrypted keg payload
     * @throws AntiTamperError
     */
    detectTampering(payload) {
        if (payload._sys.kegId !== this.id) {
            throw new AntiTamperError(`Inner ${payload._sys.kegId} and outer ${this.id} keg id mismatch.`);
        }
        if (payload._sys.type !== this.type) {
            throw new AntiTamperError(`Inner ${payload._sys.type} and outer ${this.type} keg type mismatch.`);
        }
    }

}

module.exports = Keg;
