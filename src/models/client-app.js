/**
 * A store for client application related properties/states.
 * A way for UI code to communicate with SDK.
 */
const { observable } = require('mobx');

class ClientApp {
    @observable isFocused = true;
}

module.exports = new ClientApp();
