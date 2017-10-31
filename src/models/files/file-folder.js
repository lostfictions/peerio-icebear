const { observable } = require('mobx');
const createMap = require('../../helpers/dynamic-array-map');
const cryptoUtil = require('../../crypto/util');
const { getUser } = require('../../helpers/di-current-user');

class FileFolder {
    @observable files = [];
    @observable folders = [];
    @observable name;

    parent = null;
    isFolder = true;
    get isRoot() { return !this.parent; }

    constructor(name) {
        const m = createMap(this.files, 'fileId');
        this.name = name;
        this.fileId = name;
        this.fileMap = m.map;
        this.fileMapObservable = m.observableMap;
    }

    add(file) {
        if (this.fileMap[file.fileId]) {
            console.debug(`file-folders.js: file already exists ${file.fileId}`);
            return;
        }
        if (file.folder) {
            console.error(`file-folders.js: file already belongs to a folder`);
            return;
        }
        file.folder = this;
        this.files.push(file);
    }

    createFolder(name) {
        const folder = new FileFolder(name);
        folder.folderId = cryptoUtil.getRandomUserSpecificIdB64(getUser().username);
        this.addFolder(folder);
        return folder;
    }

    addFolder(folder) {
        if (folder.parent) {
            console.error(`file-folders.js: folder already belongs to a folder`);
            return folder;
        }
        folder.parent = this;
        this.folders.push(folder);
        return folder;
    }

    free(file) {
        const i = this.files.indexOf(file);
        if (i !== -1) {
            this.files.splice(i, 1);
            file.folder = null;
        } else {
            console.error(`file-folders.js: free cannot find the file`);
        }
    }

    freeFolder(folder) {
        const i = this.folders.indexOf(folder);
        if (i !== -1) {
            this.folders.splice(i, 1);
            folder.parent = null;
        } else {
            console.error(`file-folders.js: free cannot find the folder`);
        }
    }

    freeSelf() {
        if (this.isRoot) return;
        let root = this;
        while (!root.isRoot) root = root.parent;
        this.files.forEach(file => {
            this.free(file);
            root.add(file);
        });
        this.folders.forEach(folder => this.freeFolder(folder));
        this.parent.freeFolder(this);
    }

    moveInto(file) {
        if (file.folder) file.folder.free(file);
        this.add(file);
    }

    getFiles() {
        return this.files;
    }
}

module.exports = FileFolder;
