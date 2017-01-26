const { observable } = require('mobx');

class MockSocketClient {

    @observable connected = false;
    @observable authenticated = false;

    start() {
        this.connected = true;
        this.started = false;
    }

    subscribe() {

    }

    send(name, data) {
        console.log('mock send');
        return {};
    }
}
module.exports = MockSocketClient;
