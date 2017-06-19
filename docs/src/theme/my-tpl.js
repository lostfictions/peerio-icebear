global.getAccessIcon = function(item) {
    switch (item.access) {
        case 'public': return '';
        case 'private': return 'fa-lock';
        case 'protected': return 'fa-cogs';
    }
    return 'fa-question';
};

global.getAccessClass = function(item) {
    switch (item.access) {
        case 'public': return '';
        case 'private':
        case 'protected':
            return 'dim';
    }
    return '';
};
