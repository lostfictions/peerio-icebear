/**
 * Chat files handling module
 */
const { when } = require('mobx');
const fileStore = require('../files/file-store');

class ChatFileHandler {

    constructor(chat) {
        this.chat = chat;
    }

    /**
     * Initiates file upload and shares it to the chat afterwards
     * @param {string} path - full file path
     * @param {[string]} name - override file name, specify to store the file in Peerio with this name
     * @return {File}
     */
    uploadAndShare(path, name) {
        const file = fileStore.upload(path, name);
        file.uploadQueue = this.chat.uploadQueue; // todo: change, this is dirty
        this.chat.uploadQueue.push(file);
        const deletedDisposer = when(() => file.deleted, () => {
            this.chat.uploadQueue.remove(file);
        });
        when(() => file.readyForDownload, () => {
            this.chat.uploadQueue.remove(file);
            this.share([file]);
            deletedDisposer();
        });
        return file;
    }


    /**
     * Shares files to chat
     * @param {Array<File>} files
     */
    share(files) {
        const ids = this.shareFileKegs(files);
        // DO NOT return promise here, it might trigger unwanted retry attempts
        this.chat.sendMessage('', ids);
    }


    /**
     * Shares existing Peerio files with a chat.
     * This function performs only logical sharing, meaning provides permissions/access for recipients.
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
            this.chat.participants.forEach(p => {
                if (p.isMe) return;
                // todo: handle failure
                file.share(p);
            });
            ids.push(file.fileId);
        }
        return ids;
    }
}
module.exports = ChatFileHandler;
