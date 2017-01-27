function getFileName(path) {
    return path.replace(/^.*[\\/]/, '');
}

function getFileExtension(name) {
    let extension = name.toLowerCase().match(/\.\w+$/);
    extension = extension ? extension[0].substring(1) : '';
    return extension;
}

module.exports = { getFileName, getFileExtension };
