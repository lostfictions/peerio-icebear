function getFileName(path) {
    return path.replace(/^.*[\\/]/, '');
}

function getFileExtension(name) {
    const ind = name.lastIndexOf('.');
    return ind < 0 ? '' : name.substr(ind + 1);
}

module.exports = { getFileName, getFileExtension };
