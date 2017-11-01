const { observable, when } = require('mobx');
const { getUser } = require('../../helpers/di-current-user');
const socket = require('../../network/socket');
const FileFolder = require('./file-folder');
const FileFoldersKeg = require('./file-folders-keg');

class FileFolders {
    constructor(fileStore) {
        this.fileStore = fileStore;
        when(() => this.loaded, () => this.init());
        socket.onceAuthenticated(() => {
            this.keg = new FileFoldersKeg(getUser().kegDb);
        });
    }
    @observable initialized;
    @observable keg = null;

    get loaded() { return this.keg && this.keg.loaded; }

    get formatVersion() { return this.keg.formatVersion; }

    root = new FileFolder(null, '/');

    fileResolveMap;

    _addFile = (file) => {
        const { fileResolveMap, root } = this;
        const folderToResolve = fileResolveMap[file.fileId];
        if (folderToResolve) {
            folderToResolve.add(file);
            delete fileResolveMap[file.fileId];
        } else {
            root.add(file);
        }
    }

    async init() {
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
        const { fileResolveMap, root } = this;
        root.deserialize(this.keg, null, fileResolveMap);
        files.forEach(this._addFile);
        this._intercept = files.intercept(delta => {
            for (let i = delta.removedCount; i > 0; i--) {
                const el = delta.object[delta.index + i - 1];
                if (el.folder) el.folder.free(el);
            }
            delta.added.forEach(this._addFile);
            return delta;
        });
        this.initialized = true;
    }

    createDefault() {
        this.keg.formatVersion = '1.0';
    }

    deleteFolder(folder) {
        folder.freeSelf();
        this.save();
    }

    save() {
        this.keg.save(() => {
            this.keg.folders = this.root.folders.map(f => f.serialize());
        }, () => this.init(), 'error_savingFileFolders');
    }
}

module.exports = FileFolders;
