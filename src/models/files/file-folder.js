const { observable, computed } = require('mobx');
const createMap = require('../../helpers/dynamic-array-map');

class FileFolder {
    @observable files = [];
    @observable folders = [];
    @observable name;
    @observable createdAt;

    @computed get normalizedName() { return this.name ? this.name.toLowerCase() : ''; }

    @computed get foldersSortedByName() {
        return this.folders.sort((f1, f2) => f1.normalizedName > f2.normalizedName);
    }

    @computed get filesSortedByDate() {
        return this.files.sort((f1, f2) => f2.uploadedAt - f1.uploadedAt);
    }

    @computed get foldersAndFilesDefaultSorting() {
        const { foldersSortedByName, filesSortedByDate } = this;
        return foldersSortedByName.concat(filesSortedByDate);
    }

    parent = null;
    isFolder = true;
    get isRoot() { return !this.parent; }
    get hasNested() { return this.folders && this.folders.length; }

    constructor(name) {
        const m = createMap(this.files, 'fileId');
        this.name = name;
        this.fileId = name;
        this.fileMap = m.map;
        this.fileMapObservable = m.observableMap;
        const m2 = createMap(this.folders, 'folderId');
        this.folderMap = m2.map;
    }

    add(file) {
        if (this.fileMap[file.fileId]) {
            return;
        }
        if (file.folder) {
            console.error(`file-folders.js: file already belongs to a folder`);
            return;
        }
        file.folder = this;
        this.files.push(file);
    }

    addFolder(folder) {
        if (folder.parent === this) return folder;
        if (this.folderMap[folder.folderId]) {
            console.error(`file-folders.js: folder already exists here`);
            return folder;
        }
        if (folder.parent) {
            console.debug(`file-folders.js: moving folder from parent`);
            folder.parent.freeFolder(folder);
        }
        folder.parent = this;
        this.folders.push(folder);
        return folder;
    }

    free(file) {
        if (!this.fileMap[file.fileId]) {
            console.error(`file-folders.js: file does not belong to a folder`);
            return;
        }
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
            file.folder = null;
            root.add(file);
        });
        this.files = [];
        this.folders.forEach(folder => folder.freeSelf());
        this.folders = [];
        this.parent && this.parent.freeFolder(this);
    }

    moveInto(file) {
        if (file.isFolder) {
            if (file === this) {
                console.error('cannot move folder in itself');
                return;
            }
            file.parent.freeFolder(file);
            this.addFolder(file);
        } else {
            if (file.folder) file.folder.free(file);
            this.add(file);
        }
    }

    findFolderByName(name) {
        const normalizedName = name.toLowerCase();
        return this.folders.find(f => f.normalizedName === normalizedName);
    }

    serialize() {
        const { name, folderId, createdAt } = this;
        const files = this.files.map(f => f.fileId);
        const folders = this.folders.map(f => f.serialize());
        return { name, folderId, createdAt, files, folders };
    }

    deserialize(dataItem, parent, fileResolveMap, folderResolveMap, newFolderResolveMap) {
        const { folderId, name, createdAt, files, folders } = dataItem;
        Object.assign(this, { folderId, name, createdAt });
        files && files.forEach(fileId => {
            fileResolveMap[fileId] = this;
        });
        folders && folders.map(f => {
            let folder = folderResolveMap[f.folderId];
            if (!folder) {
                folder = new FileFolder();
            }
            folder.deserialize(f, this, fileResolveMap, folderResolveMap, newFolderResolveMap);
            newFolderResolveMap[f.folderId] = folder;
            return folder;
        });
        parent && parent.addFolder(this);
        return this;
    }
}

module.exports = FileFolder;
