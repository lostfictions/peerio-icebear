const { observable, action } = require('mobx');
const { getUser } = require('../../helpers/di-current-user');
const socket = require('../../network/socket');
const FileFolder = require('./file-folder');
const FileFoldersKeg = require('./file-folders-keg');
const cryptoUtil = require('../../crypto/util');

class FileFolders {
    constructor(fileStore) {
        this.fileStore = fileStore;
        socket.onceAuthenticated(() => {
            this.keg = new FileFoldersKeg(getUser().kegDb);
            this.keg.onUpdated = () => {
                console.log(`file folders updated`);
                this.sync();
            };
        });
    }
    @observable initialized;
    @observable keg = null;

    get loaded() { return this.keg && this.keg.loaded; }

    get formatVersion() { return this.keg.formatVersion; }

    root = new FileFolder(null, '/');

    fileResolveMap = {};
    folderResolveMap = {};

    _addFile = (file) => {
        const { fileResolveMap, root } = this;
        const folderToResolve = fileResolveMap[file.fileId];
        if (folderToResolve) {
            console.log(`this file has folder to resolve`);
        }
        if (file.folder && file.folder === folderToResolve) return;
        if (folderToResolve) {
            file.folder && file.folder.free(file);
            folderToResolve.add(file);
            delete fileResolveMap[file.fileId];
        } else {
            !file.folder && root.add(file);
        }
    }

    @action async sync() {
        if (!this.keg.formatVersion) {
            this.createDefault();
            await this.keg.saveToServer();
        }
        const { files } = this.fileStore;
        this.fileResolveMap = {};
        if (this._intercept) {
            this._intercept();
            this._intercept = null;
        }
        const { fileResolveMap, folderResolveMap, root } = this;
        const newFolderResolveMap = {};
        root.deserialize(this.keg, null, fileResolveMap, folderResolveMap, newFolderResolveMap);
        // remove files from folders if they aren't present in the keg
        files.forEach(f => {
            if (f.folder && f.folder !== root && !fileResolveMap[f.fileId]) {
                f.folder.free(f);
            }
        });
        // remove folders if they aren't present in the keg
        for (const folderId in folderResolveMap) {
            if (!newFolderResolveMap[folderId]) {
                folderResolveMap[folderId].freeSelf();
            }
        }
        this.folderResolveMap = newFolderResolveMap;
        files.forEach(this._addFile);
        this._intercept = files.observe(delta => {
            for (let i = delta.removedCount; i > 0; i--) {
                const el = delta.object[delta.index + i - 1];
                if (el.folder) el.folder.free(el);
            }
            delta.added.forEach(this._addFile);
            return delta;
        });
        console.log('file-folders: step 3');
        this.initialized = true;
    }

    createDefault() {
        this.keg.formatVersion = '1.0';
    }

    deleteFolder(folder) {
        folder.freeSelf();
        this.save();
    }

    createFolder(name, parent) {
        const folder = new FileFolder(name);
        const folderId = cryptoUtil.getRandomUserSpecificIdB64(getUser().username);
        folder.folderId = folderId;
        this.folderResolveMap[folderId] = folder;
        (parent || this.root).addFolder(folder);
        return folder;
    }

    save() {
        this.keg.save(() => {
            this.keg.folders = this.root.folders.map(f => f.serialize());
        }, () => this.sync(), 'error_savingFileFolders');
    }
}

module.exports = FileFolders;
