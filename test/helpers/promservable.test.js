const { resetApp } = require('../helpers');
const { observable } = require('mobx');

describe('Promservable should', () => {
    let asPromise;

    beforeEach(() => {
        resetApp();
        asPromise = require('../../src/helpers/prombservable').asPromise;
    });

    it('execute when property changes', () => {
        class Chats {
            @observable loaded = false;
        }

        const chats = new Chats();
        const promise = asPromise(chats, 'loaded', true);
        chats.loaded = true;

        return promise.should.be.fulfilled;
    });
});
