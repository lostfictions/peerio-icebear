const { t } = require('peerio-translator');

function getSystemMessageText(msg) {
    switch (msg.systemData.action) {
        case 'rename':
            return msg.systemData.newName
                ? t('title_chatRenamed', { name: msg.systemData.newName })
                : t('title_chatNameRemoved');
        case 'create':
            return t('title_chatCreated', { fullName: msg.sender.fullName });
        default:
            return '';
    }
}

module.exports = { getSystemMessageText };
