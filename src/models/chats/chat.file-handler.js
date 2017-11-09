// @ts-check

const { when, action } = require('mobx');
const fileStore = require('../files/file-store');
const config = require('../../config');
const TaskQueue = require('../../helpers/task-queue');
const { retryUntilSuccess } = require('../../helpers/retry');
const socket = require('../../network/socket');

// for typechecking:
/* eslint-disable no-unused-vars */
const Chat = require('./chat');
const File = require('../files/file');
/* eslint-enable no-unused-vars */

/**
 * File handling module for Chat. Extracted for readability.
 * @param {Chat} chat - chat creates an instance and passes itself to it.
 * @public
 */
class ChatFileHandler {
    constructor(chat) {
        /**
         * @type {Chat} chat
         */
        this.chat = chat;
    }

    /**
     * TaskQueue of files to share for paced process.
     * @member {TaskQueue} shareQueue
     * @protected
     */
    shareQueue = new TaskQueue(1, 2000);

    /**
     * Initiates file upload and shares it to the chat afterwards.
     * Note that if app session ends before this is done - files will be only uploaded by resume logic.
     * But chat message will not be sent.
     * @param {string} path - full file path
     * @param {string} [name] - override file name, specify to store the file keg with this name
     * @param {boolean} [deleteAfterUpload=false] - delete local file after successful upload
     * @param {function} [beforeShareCallback=null] - function returning Promise which will be waited for
     *                                                before file is shared. We need this to finish keg preparations.
     * @returns {File}
     * @public
     */
    uploadAndShare(path, name, deleteAfterUpload = false, beforeShareCallback = null) {
        const file = fileStore.upload(path, name);
        file.name = name;
        file.customTempCachePath = path;
        file.tmpCached = true;
        file.uploadQueue = this.chat.uploadQueue; // todo: change, this is dirty
        this.chat.uploadQueue.push(file);
        fileStore.files.push(file);
        let limboMessage = null;
        const cleanup = () => {
            this.chat.limboMessages.remove(limboMessage);
            this.chat.uploadQueue.remove(file);
            // TODO @anri: if upload fails, file needs to be deleted
            // is this ok?
            fileStore.files.remove(file);
        };
        const deletedDisposer = when(() => file.deleted, cleanup);
        limboMessage = this.chat.createLimboFilesMessage([file.fileId]);
        when(() => file.readyForDownload, action(async () => {
            this.chat.uploadQueue.remove(file);
            if (beforeShareCallback) {
                await beforeShareCallback();
            }
            const deleteMessageDisposer = when(() => limboMessage.sendError, cleanup);
            when(() => !limboMessage.sending, deleteMessageDisposer);
            this.shareLimboMessage(limboMessage, file);
            if (deleteAfterUpload) {
                config.FileStream.delete(path);
            }
            deletedDisposer();
        }));
        return file;
    }


    /**
     * Shares previously uploaded files to chat.
     * @param {Array<File>} files
     * @returns {Promise}
     */
    share(files) {
        // @ts-ignore no bluebird-promise assignability with jsdoc
        return Promise.map(files, (f) => {
            return this.shareQueue.addTask(() => {
                const ids = this.shareFileKegs([f]);
                return this.chat.sendMessage('', ids);
            });
        });
    }

    /**
     * Shares previously uploaded files to chat.
     * @param {Message} message
     * @returns {Promise}
     */
    shareLimboMessage(m, file) {
        // @ts-ignore no bluebird-promise assignability with jsdoc
        return this.shareQueue.addTask(() => {
            return this.shareFileKegsPromise([file])
                .then(() => this.chat.pushLimboFilesMessage(m))
                .catch(e => {
                    console.error('error sharing limbo file message');
                    console.error(e);
                    m.sendError = true;
                });
        });
    }

    /**
     * Shares existing Peerio files with a chat.
     * This function performs only logical sharing, provides permissions/access for recipients.
     * It doesn't inform recipients in the chat about the fact of sharing.
     * @param {Array<File>} files
     * @return {Array<string>} - fileId list
     * @private
     */
    shareFileKegs(files) {
        if (!files || !files.length) return null;
        const ids = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // todo: handle failure
            file.share(this.chat.participants);
            ids.push(file.fileId);
        }
        return ids;
    }

    /**
     * Shares existing Peerio files with a chat.
     * This function performs only logical sharing, provides permissions/access for recipients.
     * It doesn't inform recipients in the chat about the fact of sharing.
     * @param {Array<File>} files
     * @return {Array<string>} - fileId list
     * @private
     */
    shareFileKegsPromise(files) {
        if (!files || !files.length) return null;
        const ids = [];
        const promises = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // todo: handle failure
            promises.push(file.share(this.chat.participants));
            ids.push(file.fileId);
        }
        return Promise.all(promises).then(() => ids);
    }


    getRecentFiles() {
        return retryUntilSuccess(() => {
            return socket.send('/auth/kegs/db/files/latest',
                { kegDbId: this.chat.id, count: config.chat.recentFilesDisplayLimit })
                .then(res => {
                    const ids = [];
                    res.forEach(raw => {
                        const fileIds = JSON.parse(raw);
                        fileIds.forEach(id => {
                            if (!ids.includes(id)) ids.push(id);
                        });
                    });
                    return ids;
                });
        });
    }
}
module.exports = ChatFileHandler;
