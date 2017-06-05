const socket = require('../network/socket');
const { observable, reaction } = require('mobx');
const { retryUntilSuccess } = require('../helpers/retry');

class ServerSettings {

    @observable avatarServer = '';
    @observable.ref acceptableClientVersions;
    @observable tag;
    constructor() {
        reaction(() => socket.authenticated, (authenticated) => {
            if (authenticated) this.loadSettings();
        }, true);
    }

    loadSettings() {
        retryUntilSuccess(() => {
            return socket.send('/auth/server/settings')
                .then(res => {
                    this.avatarServer = res.fileBaseUrl;
                    this.acceptableClientVersions = res.acceptsClientVersions;
                    this.tag = res.tag;
                    console.log('Server settings retrieved.', this.tag, this.avatarServer, this.acceptableClientVersions);
                });
        }, 'Server Settings Load');
    }

}

module.exports = new ServerSettings();
