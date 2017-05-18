function getFileName(path) {
    return path.replace(/^.*[\\/]/, '');
}

function getFileNameWithoutExtension(path) {
    return getFileName(path).replace(/\.\w+$/, '');
}

function getFileExtension(name) {
    let extension = name.toLocaleLowerCase().match(/\.\w+$/);
    extension = extension ? extension[0].substring(1) : '';
    return extension;
}

module.exports = { getFileName, getFileExtension, getFileNameWithoutExtension };
