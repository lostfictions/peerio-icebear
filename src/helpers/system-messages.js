/**
 * Helpers for dealing with chat system messages. For UI use.
 *
 * Some chat messages are in fact sent automatically by client and instead of text they carry special systemData codes.
 * We don't want clients to repeat handling logic of those codes when system message has to be rendered, this
 * module should be used instead.
 * @module helpers/system-messages
 * @public
 */

const { t } = require('peerio-translator');

/**
 * Checks message object for system data and returns translated string to render for the system data.
 * @param {Message} msg
 * @returns {string} - translated string to render for this system message
 * @memberof helpers/system-messages
 * @public
 */
function getSystemMessageText(msg) {
    switch (msg.systemData.action) {
        case 'rename':
            return msg.systemData.newName
                ? t('title_chatRenamed', { name: msg.systemData.newName })
                : t('title_chatNameRemoved');
        case 'purposeChange':
            return msg.systemData.newPurpose
                ? t('title_chatPurposeChanged', { purpose: msg.systemData.newPurpose })
                : t('title_chatPurposeRemoved');
        case 'create':
            return t('title_chatCreated', { fullName: msg.sender.fullName });
        case 'join':
            return t('title_userJoined');
        case 'leave':
            return t('title_userLeft');
        case 'inviteSent':
            return t('title_inviteSent', { username: msg.systemData.username });
        case 'kick':
            return t('title_userKicked', { username: msg.systemData.username });
        case 'assignRole':
            return t('title_roleAssigned', { username: msg.systemData.username, role: getRoleName(msg.systemData.role) });
        case 'unassignRole':
            return t('title_roleUnassigned', { username: msg.systemData.username, role: getRoleName(msg.systemData.role) });
        default:
            return '';
    }
}

function getRoleName(role) {
    switch (role) {
        case 'admin': return t('title_admin');
        default: return '';
    }
}

module.exports = { getSystemMessageText };
