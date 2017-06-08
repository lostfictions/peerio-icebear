
const { observable, computed } = require('mobx');
const contactStore = require('./../contacts/contact-store');
const User = require('./../user/user');
const Keg = require('./../kegs/keg');
const _ = require('lodash');

class Message extends Keg {
    @observable sending = false;
    @observable sendError = false;
    @observable receipts; // array of usernames
    @observable.shallow userMentions = [];
    // ----- calculated in chat store, used in ui
    // is this message first in the day it was sent (and loaded message page)
    @observable firstOfTheDay;
    // whether or not to group this message with previous one in message list
    @observable groupWithPrevious;

    // for UI use
    @observable.shallow inlineImages = [];

    // some properties are filly cotrolled by UI and when SDK replaces obect with it's updated equivalent copy
    // we want to retain those properties
    setUIPropsFrom(msg) {
        this.inlineImages = msg.inlineImages;
    }
    // -----
    // used to compare calendar days
    @computed get dayFingerprint() {
        if (!this.timestamp) return null;
        return this.timestamp.getDate().toString() +
            this.timestamp.getMonth().toString() +
            this.timestamp.getFullYear().toString();
    }
    /**
     * @param {ChatStore} db - chat db
     */
    constructor(db) {
        super(null, 'message', db);
    }

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

    setRenameFact(newName) {
        this.systemData = {
            action: 'rename',
            newName
        };
    }

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
        this.sender = contactStore.getContact(this.owner);
        this.text = payload.text;
        this.systemData = payload.systemData;
        this.timestamp = new Date(payload.timestamp);
        this.userMentions = payload.userMentions;
        if (payload.files) {
            this.files = JSON.parse(payload.files);
        }

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

    deserializeProps(props) {
        // files are in props only for search
    }
}

module.exports = Message;
