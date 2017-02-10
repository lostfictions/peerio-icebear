const { observable } = require('mobx');
const contactStore = require('./stores/contact-store');
const User = require('./user');
const Keg = require('./kegs/keg');

class Message extends Keg {
    @observable sending = false;
    @observable sendError = false;
    @observable receipts; // array of usernames
    /**
     * @param {ChatStore} db - chat db
     */
    constructor(db) {
        super(null, 'message', db);
    }

    send(text) {
        this.sending = true;
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
                // todo: remove tempId ?
            });
    }

    serializeKegPayload() {
        return {
            sender: this.sender.username,
            text: this.text,
            timestamp: this.timestamp.valueOf()
        };
    }

    deserializeKegPayload(payload) {
        this.sender = contactStore.getContact(payload.sender);
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
