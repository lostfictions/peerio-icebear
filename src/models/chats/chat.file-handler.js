const { when } = require('mobx');
const fileStore = require('../files/file-store');
const config = require('../../config');
const Queue = require('../../helpers/queue');

/**
 * File handling module for Chat. Extracted for readability.
 * @param {Chat} chat - chat creates an instance and passes itself to it.
 * @public
 */
class ChatFileHandler {
    constructor(chat) {
        this.chat = chat;
    }

    /**
     * Queue of files to share for paced process.
     * @member {Queue}
     * @protected
     */
    shareQueue = new Queue(1, 2000);

    /**
     * Initiates file upload and shares it to the chat afterwards.
     * Note that if app session ends before this is done - files will be only uploaded by resume logic.
     * But chat message will not be sent.
     * @param {string} path - full file path
     * @param {string} [name] - override file name, specify to store the file keg with this name
     * @param {bool} [deleteAfterUpload=false] - delete local file after successful upload
     * @returns {File}
     * @public
     */
    uploadAndShare(path, name, deleteAfterUpload = false) {
        const file = fileStore.upload(path, name);
        file.uploadQueue = this.chat.uploadQueue; // todo: change, this is dirty
        this.chat.uploadQueue.push(file);
        const deletedDisposer = when(() => file.deleted, () => {
            this.chat.uploadQueue.remove(file);
        });
        when(() => file.readyForDownload, () => {
            this.chat.uploadQueue.remove(file);
            this.share([file]);
            if (deleteAfterUpload) {
                config.FileStream.delete(path);
            }
            deletedDisposer();
        });
        return file;
    }


    /**
     * Shares previously uploaded files to chat.
     * @param {Array<File>} files
     * @returns {Promise}
     */
    share(files) {
        return Promise.map(files, (f) => {
            return this.shareQueue.addTask(() => {
                const ids = this.shareFileKegs([f]);
                return this.chat.sendMessage('', ids);
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
}
module.exports = ChatFileHandler;
