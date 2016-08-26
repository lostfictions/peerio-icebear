const observable = require('mobx').observable;

class Chats {
    @observable currentPageItems = [];
    @observable totalCount = -1;

    set currentPage(page) {
        this.page = page;
    }
}

module.exports = new Chats();
