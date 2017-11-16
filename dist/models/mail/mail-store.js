'use strict';

var _dec, _desc, _value, _class, _descriptor, _descriptor2, _descriptor3;

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

const { observable, action, computed } = require('mobx');
const socket = require('../../network/socket');
const User = require('../user/user');
const Mail = require('./mail');
const tracker = require('../update-tracker');
const _ = require('lodash');
const { retryUntilSuccess } = require('../../helpers/retry');

let MailStore = (_dec = observable.shallow, (_class = class MailStore {

    static isMailSelected(mail) {
        return mail.selected;
    }

    static isMailOutgoing(mail) {
        return !!mail.sentId;
    }

    static isMailIncoming(mail) {
        return !mail.sentId;
    }

    get hasSelectedMails() {
        return this.mails.some(MailStore.isMailSelected);
    }

    get allVisibleSelected() {
        for (let i = 0; i < this.mails.length; i++) {
            if (!this.mails[i].show) continue;
            if (this.mails[i].selected === false) return false;
        }
        return true;
    }

    get selectedCount() {
        return this.mails.reduce((count, m) => count + (m.selected ? 1 : 0));
    }

    /*
     * Returns currently selected mails (mail.selected == true)
     * @returns {Array<Mail>}
     */
    getSelectedMails() {
        return this.mails.filter(MailStore.isMailSelected);
    }

    /*
     * Returns all incoming mails.
     * @returns {Array<Mail>}
     */
    getIncomingMails() {
        return this.mails.filter(MailStore.isMailIncoming);
    }

    /*
     * Returns all outgoing mails.
     * @returns {Array<Mail>}
     */
    getOutgoingMails() {
        return this.mails.filter(MailStore.isMailOutgoing);
    }

    /*
     * Deselects all mails
     */
    clearSelection() {
        for (let i = 0; i < this.mails.length; i++) {
            this.mails[i].selected = false;
        }
    }

    selectAll() {
        for (let i = 0; i < this.mails.length; i++) {
            const mail = this.mails[i];
            if (!mail.show) continue;
            this.mails[i].selected = true;
        }
    }

    // TODO: more filters

    filterBySubject(query) {
        this.currentFilter = query;
        const regex = new RegExp(_.escapeRegExp(query), 'i');
        for (let i = 0; i < this.mails.length; i++) {
            this.mails[i].show = regex.test(this.mails[i].subject);
            if (!this.mails[i].show) this.mails[i].selected = false;
        }
    }

    clearFilter() {
        this.currentFilter = '';
        for (let i = 0; i < this.mails.length; i++) {
            this.mails[i].show = true;
        }
    }

    constructor() {
        _initDefineProp(this, 'mails', _descriptor, this);

        _initDefineProp(this, 'loading', _descriptor2, this);

        _initDefineProp(this, 'currentFilter', _descriptor3, this);

        this.loaded = false;
        this.updating = false;
        this.maxUpdateId = '';
        this.knownUpdateId = '';
        this.onMailDigestUpdate = _.throttle(() => {
            const digest = tracker.getDigest('SELF', 'mail');
            console.log(`Mail digest: ${JSON.stringify(digest)}`);
            if (digest.maxUpdateId === this.maxUpdateId) return;
            this.maxUpdateId = digest.maxUpdateId;
            this.updateMails(this.maxUpdateId);
        }, 1500);

        this.updateMails = maxId => {
            if (!this.loaded || this.updating) return;
            if (!maxId) maxId = this.maxUpdateId; // eslint-disable-line
            console.log(`Proceeding to mail update. Known collection version: ${this.knownUpdateId}`);
            this.updating = true;
            retryUntilSuccess(() => this._getMails(), 'Updating mail list').then(action(resp => {
                const kegs = resp.kegs;
                for (const keg of kegs) {
                    if (keg.collectionVersion > this.knownUpdateId) {
                        this.knownUpdateId = keg.collectionVersion;
                    }
                    const existing = this.getById(keg.props.messageId);
                    const mail = existing || new Mail(User.current.kegDb);
                    if (keg.deleted && existing) {
                        this.mails.remove(existing);
                        continue;
                    }
                    if (!mail.loadFromKeg(keg) || mail.isEmpty) continue;
                    if (!mail.deleted && !existing) this.mails.unshift(mail);
                }
                this.updating = false;
                // need this bcs if u delete all mails knownUpdateId won't be set at all after initial load
                if (this.knownUpdateId < maxId) this.knownUpdateId = maxId;
                // in case we missed another event while updating
                if (kegs.length || this.maxUpdateId && this.knownUpdateId < this.maxUpdateId) {
                    setTimeout(this.updateMails);
                } else {
                    setTimeout(this.onMailDigestUpdate);
                }
            }));
        };

        tracker.onKegTypeUpdated('SELF', 'mail', () => {
            console.log('Mails update event received');
            this.onMailDigestUpdate();
        });
    }

    _getMails() {
        const filter = this.knownUpdateId ? { minCollectionVersion: this.knownUpdateId } : { deleted: false };

        return socket.send('/auth/kegs/db/list-ext', {
            kegDbId: 'SELF',
            options: {
                type: 'mail',
                reverse: false
            },
            filter
        });
    }

    loadAllMails() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        retryUntilSuccess(() => this._getMails(), 'Initial mail list loading').then(action(kegs => {
            for (const keg of kegs.kegs) {
                const mail = new Mail(User.current.kegDb);
                if (keg.collectionVersion > this.maxUpdateId) {
                    this.maxUpdateId = keg.collectionVersion;
                }
                if (keg.collectionVersion > this.knownUpdateId) {
                    this.knownUpdateId = keg.collectionVersion;
                }
                if (mail.loadFromKeg(keg)) this.mails.unshift(mail);
            }
            this.loading = false;
            this.loaded = true;
            socket.onAuthenticated(() => {
                this.onMailDigestUpdate();
            });
            setTimeout(this.updateMails);
        }));
    }

    // this essentially does the same as loadAllMails but with filter,
    // we reserve this way of updating anyway for future, when we'll not gonna load entire mail list on start


    // todo: mails map
    getById(messageId) {
        for (let i = 0; i < this.mails.length; i++) {
            if (this.mails[i].messageId === messageId) return this.mails[i];
        }
        return null;
    }

    /*
     * Send a message.
     *
     * @param {Array<Contact>} recipients
     * @param {string} subject
     * @param {string} body
     * @param {File[]?} optional, files to attach
     * @param {string?} optional, messageId of message to reply to
     */
    send(recipients, subject, body, files, replyId) {
        const keg = new Mail(User.current.kegDb);
        keg.recipients = recipients;
        keg.subject = subject;
        keg.body = body;
        keg.files = files;
        keg.replyId = replyId;

        keg.send(recipients);
        this.mails.unshift(keg);

        // XXX: what is this?
        // const disposer = when(() => keg.deleted, () => {
        //     this.mails.remove(keg);
        // });
        // when(() => keg.sent, () => { disposer(); });

        return keg;
    }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'mails', [_dec], {
    enumerable: true,
    initializer: function () {
        return [];
    }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'loading', [observable], {
    enumerable: true,
    initializer: function () {
        return false;
    }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'currentFilter', [observable], {
    enumerable: true,
    initializer: function () {
        return '';
    }
}), _applyDecoratedDescriptor(_class.prototype, 'hasSelectedMails', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'hasSelectedMails'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'allVisibleSelected', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'allVisibleSelected'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'selectedCount', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'selectedCount'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'clearSelection', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'clearSelection'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'selectAll', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'selectAll'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'filterBySubject', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'filterBySubject'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'clearFilter', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'clearFilter'), _class.prototype)), _class));


module.exports = new MailStore();