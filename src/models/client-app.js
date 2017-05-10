/**
 * A store for client application related properties/states.
 * A way for UI code to communicate with SDK.
 */
const { observable } = require('mobx');

class ClientApp {
    @observable isFocused = true;
    @observable isInChatsView = false;
    @observable isInFilesView = false;
}

module.exports = new ClientApp();
