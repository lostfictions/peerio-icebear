const { observable, computed } = require('mobx');
const contactStore = require('./../contacts/contact-store');
const User = require('./../user/user');
const Keg = require('./../kegs/keg');

class Message extends Keg {
    @observable sending = false;
    @observable sendError = false;
    @observable receipts; // array of usernames
    // ----- calculated in chat store, used in ui
    // is this message first in the day it was sent (and loaded message page)
    @observable firstOfTheDay;
    // whether or not to group this message with previous one in message list
    @observable groupWithPrevious;
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

    send(text) {
        this.sending = true;
        this.sendError = false;
        this.assignTemporaryId();
        this.sender = contactStore.getContact(User.current.username);
        this.text = text;
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

    serializeKegPayload() {
        return {
            text: this.text,
            timestamp: this.timestamp.valueOf()
        };
    }

    deserializeKegPayload(payload) {
        this.sender = contactStore.getContact(this.owner);
        this.text = payload.text;
        this.timestamp = new Date(payload.timestamp);
    }

    serializeProps() {
        if (this.files) return { files: JSON.stringify(this.files) };
        return {};
    }

    deserializeProps(props) {
        if (props.files) {
            this.files = JSON.parse(props.files);
        }
    }
}

module.exports = Message;
