'use strict';

var _dec, _dec2, _dec3, _desc, _value, _class, _descriptor, _descriptor2;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

const { cryptoUtil, publicCrypto, keys } = require('../../crypto');
const { observable, action } = require('mobx');
const { getContactStore } = require('../../helpers/di-contact-store');
const SyncedKeg = require('../kegs/synced-keg');

/**
 * Named plaintext Boot keg for shared keg databases.
 *
 * Payload format version 1:
 * ```
 * {
 *   publicKey: b64 encoded buffer,
 *   encryptedKeys: {
 *           username: b64 encoded buffer, // encrypted for user's PK
 *           username1: b64 encoded buffer
 *         }
 * }
 * ```
 *
 * Payload format version 2:
 * ```
 * {
 *   publicKey: b64 encoded buffer, // public key from the encrypting ephemeral pair
 *   roles: {
 *      admin: ["username", "username1", ...],
 *      some_role_we_will_want_later: ["username"]
 *   },
 *   // object key = incremental key id
 *   encryptedKeys: {
 *      "0": {
 *              createdAt: number
 *              keys: {
 *                 // key id
 *                 username: {
 *                     key: b64 encoded buffer, // encrypted for user's PK
 *                     publicKey: b64 encoded buffer // user's public key (so user can still
 *                                                   // decrypt this after she changes her keys)
 *                 }
 *                 username1: {...}
 *              }
 *           },
 *      "1": {
 *           ...
 *         }
 *   }
 * }
 * ```
 *
 *  1. Adding someone to the chat with full history access
 *      - Create new 'username:encryptedKey' record in the most ALL key object
 *      - for this generate new ephemeral key pair, and re-encrypt all the stuff
 *      - Send a system message 'username was invited'
 *     At this point, invited user has full normal access to this keg db, BUT doesn't receive any notifications
 *     push or keg notifications. As user now has full access to the keg db she will infer invitation status
 *     from the special keg described below.
 * 2. Revoking invite or removing user from the channel
 *      - Delete the record for this user from ALL keys
 *      - Server deletes invite_status-username keg
 * 3. Accepting an invitation
 *      - invited user creates/undeletes invite_status-username keg with accepted:true property in it
 *      Server enables notifications when joined:true.
 * 4. Leaving a channel
 *      - participant sets joined:false
 *      - admin removes user from boot keg
 *
 * invite_status keg
 * ```
 * {
 *   accepted: boolean
 * }
 * ```
 *
 * @param {KegDb} db - owner instance
 * @param {User} user - currently authenticated user
 * @public
 */
let ChatBootKeg = (_dec = observable.shallow, _dec2 = observable.shallow, _dec3 = action.bound, (_class = class ChatBootKeg extends SyncedKeg {
    constructor(db, user) {
        // named kegs are pre-created, so we know the id already and only going to update boot keg
        super('boot', db, true, true, true, true);
        this.keys = {};

        _initDefineProp(this, 'participants', _descriptor, this);

        _initDefineProp(this, 'admins', _descriptor2, this);

        this.ignoreAntiTamperProtection = true;
        this.user = user;
        this.version = 1; // pre-created named keg
    }

    /**
     * Extracted from payload, most recent key to use for encryption.
     * The trick here is that this property will only get updated after new keg key
     * if it was added, is successfully saved to server.
     * @member {Uint8Array}
     */

    /**
     * Most recent key id
     * @member {string}
     */

    /**
     * Extracted from payload to use for decryption.
     * @member {{keyId: { createdAt: number, key: Uint8Array } }}
     */


    /**
     * List of usernames who have access to the chat currently.
     * This includes users pending join confirmation.
     * @member {Array<Contact>} participants
     * @memberof ChatBootKeg
     * @instance
     * @public
     */


    /**
     * Subset of `this.participants`.
     * @member {Array<Contact>} admins
     * @memberof ChatBootKeg
     * @instance
     * @public
     */


    /**
     * Gives access to chat keys to a contact.
     * @param {Contact} contact
     * @public
     */
    addParticipant(contact) {
        if (this.participants.includes(contact)) return;
        this.participants.push(contact);
    }

    /**
     * Gives access to chat keys to a contact.
     * @param {Contact} contact
     * @public
     */
    removeParticipant(contact) {
        this.participants.remove(contact);
    }

    /**
     * Adds a new key, deprecating current key, or initializes empty boot keg with the first key.
     * @memberof ChatBootKeg
     */
    addKey() {
        if (this.dirty) throw new Error('Can not add key to chat boot keg because unsaved key exists.');
        // NOTE: if this is not the first key, we intentionally do not update `this.kegKey` and `this.kegKeyId`,
        // because it's dangerous to encrypt with the key that has not been saved yet.
        // Fields will get updated after boot keg is saved.
        const key = keys.generateEncryptionKey();
        const ids = Object.keys(this.keys).map(id => +id);
        const maxId = (ids.length ? Math.max(...ids) + 1 : 0).toString();
        this.keys[maxId] = {
            createdAt: Date.now(),
            key
        };
        this.dirty = true;
        if (maxId === '0') {
            this.kegKey = this.keys[maxId].key;
            this.kegKeyId = maxId;
        }
    }

    /**
     * Overrides SyncedKeg#onSaved
     * @private
     */
    onSaved() {
        const ids = Object.keys(this.keys).map(id => +id);
        const maxId = Math.max(...ids).toString();
        this.kegKey = this.keys[maxId].key;
        this.kegKeyId = maxId;
    }

    /**
     * Assigns a role to chat participant
     * @param {Contact} contact - contact to assign a role to
     * @param {string} role - currently can be only 'admin'
     * @memberof ChatBootKeg
     */
    assignRole(contact, role) {
        if (role !== 'admin') throw new Error('Only admin role is currently supported');
        if (!this.admins.includes(contact)) {
            // should not happen, but just to be safe
            const duplicate = this.admins.filter(d => d.username === contact.username);
            duplicate.forEach(d => this.admins.remove(d));

            this.admins.push(contact);
        }
    }
    /**
     * Removes role from a participant
     * @param {Contact} contact
     * @param {string} role
     * @memberof ChatBootKeg
     */
    unassignRole(contact, role) {
        if (role !== 'admin') throw new Error('Only admin role is currently supported.');
        // we do it this way to prevent potential errors around contacts that failed to load for whatever reason,
        if (!this.admins.includes(contact)) return;
        if (this.admins.length < 2) throw new Error('Can not remove last admin from boot keg.');
        this.admins.remove(contact);
    }

    deserializeKegPayload(data) {
        if (this.format === 1) {
            this.deserializeKegPayloadFormat1(data);
        } else {
            this.deserializeKegPayloadFormat0(data);
        }
    }

    deserializeKegPayloadFormat0(data) {
        // keys for every participant
        this.encryptedKeys = data.encryptedKeys;
        // public key from ephemeral key pair that encrypted keys
        this.publicKey = cryptoUtil.b64ToBytes(data.publicKey);
        // decrypting keg key that was encrypted for me
        let kegKey = data.encryptedKeys[this.user.username];
        kegKey = cryptoUtil.b64ToBytes(kegKey);
        kegKey = publicCrypto.decrypt(kegKey, this.publicKey, this.user.encryptionKeys.secretKey);
        if (kegKey === false) {
            console.error('Failed to decrypt chat key for myself.');
            // todo: mark as invalid to prevent message loading attempts?
            return;
        }
        this.kegKey = kegKey;
        this.kegKeyId = '0';
        this.keys[this.kegKeyId] = { key: this.kegKey, createdAt: Date.now() };
    }

    deserializeKegPayloadFormat1(data) {
        this.keys = {};
        this.kegKey = null;
        this.kegKeyId = null;

        if (!data) return;
        // decoding
        data.publicKey = cryptoUtil.b64ToBytes(data.publicKey);
        // parsing roles
        this.admins.clear();
        data.roles.admin.forEach(username => {
            this.admins.push(getContactStore().getContact(username));
        }, this);

        // we iterate key history and decrypt keys that were encrypted for our user
        for (const keyId in data.encryptedKeys) {
            const keyObj = data.encryptedKeys[keyId];
            if (!keyObj) continue; // todo: err log
            const usersKey = keyObj.keys[this.user.username];
            if (!usersKey) continue; // todo: err log
            // currently we ignore keyObj.publicKey, but when we add key change feature for users, we'll need it
            let kegKey = cryptoUtil.b64ToBytes(usersKey);
            kegKey = publicCrypto.decrypt(kegKey, data.publicKey, this.user.encryptionKeys.secretKey);
            this.keys[keyId] = { key: kegKey, createdAt: keyObj.createdAt };
        }
        // we find max key id to assign current key to use for encryption
        const maxKeyId = Math.max(...Object.keys(data.encryptedKeys).map(id => +id)).toString();
        this.kegKey = this.keys[maxKeyId];
        // todo: throw fatal error to stop retries
        if (this.kegKey) this.kegKey = this.kegKey.key;
        this.kegKeyId = maxKeyId;
        // we extract participant list from the current key object
        this.participants = Object.keys(data.encryptedKeys[maxKeyId].keys).map(username => getContactStore().getContact(username));
    }

    serializeKegPayload() {
        this.format = 1;
        const ephemeralKeyPair = keys.generateEncryptionKeyPair();
        const ret = {};
        ret.publicKey = cryptoUtil.bytesToB64(ephemeralKeyPair.publicKey);
        ret.roles = {
            admin: this.admins.map(c => c.username)
        };
        const k = ret.encryptedKeys = {};
        for (const id in this.keys) {
            const keyData = this.keys[id];
            k[id] = {
                createdAt: keyData.createdAt,
                keys: {}
            };
            this.participants.forEach(c => {
                if (c.deleted || c.notFound) return;
                if (c.loading) {
                    throw new Error(`Can not save boot keg because participant Contact (${c.username}) is not loaded`);
                }
                const encKey = publicCrypto.encrypt(keyData.key, c.encryptionPublicKey, ephemeralKeyPair.secretKey);
                k[id].keys[c.username] = cryptoUtil.bytesToB64(encKey);
            });
        }

        return ret;
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'participants', [_dec], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'admins', [_dec2], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _applyDecoratedDescriptor(_class.prototype, 'deserializeKegPayloadFormat1', [_dec3], Object.getOwnPropertyDescriptor(_class.prototype, 'deserializeKegPayloadFormat1'), _class.prototype)), _class));


module.exports = ChatBootKeg;