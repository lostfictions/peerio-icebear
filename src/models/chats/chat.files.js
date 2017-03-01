/**
 * Chat files handling module
 */
const { when } = require('mobx');
const fileStore = require('../stores/file-store');

// don't change the way it is exported, we require this object for testablity (stubs)
const chatFiles = {};

/**
 * Initiates file upload and shares it to the chat afterwards
 * @param {Chat} chat
 * @param {string} path - full file path
 * @param {[string]} name - override file name, specify to store the file in Peerio with this name
 * @return {File}
 */
chatFiles.uploadAndShare = function(chat, path, name) {
    const file = fileStore.upload(path, name);
    file.uploadQueue = chat.uploadQueue;
    chat.uploadQueue.push(file);
    when(() => file.readyForDownload, () => {
        chat.uploadQueue.remove(file);
        chatFiles.share(chat, [file]);
    });
    return file;
};


/**
 * Shares files to chat
 * @param {Chat} chat
 * @param {Array<File>} files
 */
chatFiles.share = function(chat, files) {
    const ids = shareFileKegs(chat, files);
    return chat.sendMessage('', ids);
};


/**
 * Shares existing Peerio files with a chat.
 * This function performs only logical sharing, meaning provides permissions/access for recipients.
 * It doesn't inform recipients in the chat about the fact of sharing.
 * @param {Chat} chat
 * @param {Array<File>} files
 * @return {Array<string>} - fileId list
 * @private
 */
function shareFileKegs(chat, files) {
    if (!files || !files.length) return null;
    const ids = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        chat.participants.forEach(p => {
            if (p.isMe) return;
                // todo: handle failure
            file.share(p);
        });
        ids.push(file.fileId);
    }
    return ids;
}

module.exports = chatFiles;
