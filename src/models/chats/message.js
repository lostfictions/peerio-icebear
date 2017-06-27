
const { observable, computed } = require('mobx');
const contactStore = require('./../contacts/contact-store');
const User = require('./../user/user');
const Keg = require('./../kegs/keg');
const moment = require('moment');
const _ = require('lodash');

/**
 * Message keg and model
 * @param {ChatStore} db - chat db
 * @extends {Keg}
 * @public
 */
class Message extends Keg {
    constructor(db) {
        super(null, 'message', db);
    }
    /**
     * @member {boolean} sending
     * @memberof Message
     * @instance
     * @public
     */
    @observable sending = false;
    /**
     * @member {boolean} sendError
     * @memberof Message
     * @instance
     * @public
     */
    @observable sendError = false;
    /**
     * array of usernames to render receipts for
     * @member {Array<string>} receipts
     * @memberof Message
     * @instance
     * @public
     */
    @observable receipts;
    /**
     * Which usernames are mentioned in this message.
     * @member {Array<string>} userMentions
     * @memberof Message
     * @instance
     * @public
     */
    @observable.shallow userMentions = [];
    // ----- calculated in chat store, used in ui
    /**
     * Is this message first in the day it was sent (and loaded message page)
     * @member {boolean} firstOfTheDay
     * @memberof Message
     * @instance
     * @public
     */
    @observable firstOfTheDay;
    /**
     * whether or not to group this message with previous one in message list.
     * @member {boolean} groupWithPrevious
     * @memberof Message
     * @instance
     * @public
     */
    @observable groupWithPrevious;

    /**
     * for UI use
     * @member {Array<string>} inlineImages
     * @memberof Message
     * @instance
     * @public
     */
    @observable.shallow inlineImages = [];

    /**
     * Some properties are filly controlled by UI and when SDK replaces object with its updated equivalent copy
     * we want to retain those properties.
     * @protected
     */
    setUIPropsFrom(msg) {
        this.inlineImages = msg.inlineImages;
    }
    // -----
    /**
     * used to compare calendar days
     * @member {string} dayFingerprint
     * @memberof Message
     * @instance
     * @public
     */
    @computed get dayFingerprint() {
        if (!this.timestamp) return null;
        return this.timestamp.getDate().toString() +
            this.timestamp.getMonth().toString() +
            this.timestamp.getFullYear().toString();
    }

    /**
     * TODO: mobile uses this, but desktop uses
     * TODO: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
     * TODO: resolve/unify this in favor of most performant method
     * @member {string} messageTimestampText
     * @memberof Message
     * @instance
     * @public
     */
    @computed get messageTimestampText() {
        const { timestamp } = this;
        return timestamp ? moment(timestamp).format('LT') : null;
    }
    /**
     * Sends current message (saves the keg)
     * @returns {Promise}
     * @protected
     */
    send() {
        this.sending = true;
        this.sendError = false;
        this.assignTemporaryId();
        this.sender = contactStore.getContact(User.current.username);
        this.timestamp = new Date();

        return this.saveToServer()
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
     * Creates system metadata indicating chat rename.
     * @param {string} newName
     * @protected
     */
    setRenameFact(newName) {
        this.systemData = {
            action: 'rename',
            newName
        };
    }

    /**
     * Creates system metadata indicating chat creation fact.
     * @protected
     */
    setChatCreationFact() {
        this.systemData = {
            action: 'create'
        };
    }

    serializeKegPayload() {
        this.userMentions = this.text ? _.uniq(
            this.db.participants.filter((u) => this.text.match(u.mentionRegex)).map((u) => u.username)
        ) : [];
        const ret = {
            text: this.text,
            timestamp: this.timestamp.valueOf(),
            userMentions: this.userMentions
        };
        this._serializeFileAttachments(ret);
        if (this.systemData) {
            ret.systemData = this.systemData;
        }
        return ret;
    }

    deserializeKegPayload(payload) {
        /**
         * @member {Contact} sender
         * @public
         */
        this.sender = contactStore.getContact(this.owner);
        /**
         * @member {string} text
         * @public
         */
        this.text = payload.text;
        /**
         * For system messages like chat rename fact.
         * @member {object} systemData
         * @public
         */
        this.systemData = payload.systemData;
        /**
         * @member {Date} timestamp
         * @public
         */
        this.timestamp = new Date(payload.timestamp);
        this.userMentions = payload.userMentions;
        /**
         * @member {Array<string>} files
         * @public
         */
        this.files = payload.files ? JSON.parse(payload.files) : null;
        /**
         * Does this message mention current user.
         * @member {boolean} isMention
         * @public
         */
        this.isMention = this.userMentions ? this.userMentions.includes(User.current.username) : false;
    }

    serializeProps() {
        const ret = {};
        this._serializeFileAttachments(ret);
        if (this.systemData) ret.systemAction = this.systemData.action;
        return ret;
    }

    _serializeFileAttachments(obj) {
        if (this.files) obj.files = JSON.stringify(this.files);
    }

    deserializeProps() {
        // files are in props only for search
    }
}

module.exports = Message;
