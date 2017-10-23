const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('../../helpers/appConfig');
const { when } = require('mobx');
// const { receivedEmailInvite, confirmUserEmail } = require('../../helpers/mailinatorHelper');
const runFeature = require('../../helpers/runFeature');
// const { getRandomUsername } = require('../../helpers/usernameHelper');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Then, When }) => {
    // const store;
    const app = getAppInstance();
    const store = app.chatStore;
    const other = 'gft99kr2e377zdgwygbjjonihd9x9y';
    let chatId;

    Before((testCase, done) => {
        // const app = getAppInstance();
        // store = app.chatStore;
        when(() => app.socket.connected, done);
    });

    // Scenario: Create direct message
    When('I create a direct message', { timeout: 10000 }, () => {
        const contactFromUsername = app.contactStore.getContact(other);
        return asPromise(contactFromUsername, 'loading', false)
            .then(() => {
                const chat = store.startChat([contactFromUsername]);
                chatId = chat.id;
                return asPromise(chat, 'added', true).delay(1000);
            });
    });

    Then('the receiver gets notified', (cb) => {
        const data = { username: other, passphrase: 'secret secrets', chatId };
        runFeature('Read new message from account', data)
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Then('I can read my messages', (cb) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            console.log(process.env.peerioData);
            chatId = data.chatId;

            if (chatId) {
                store.loadAllChats()
                    .then(() => {
                        when(() => store.loaded, () => {
                            const found = store.chats.find(x => x.id === chatId);
                            found.should.be.ok;
                            cb();
                        });
                    });
            } else {
                cb('No chat id passed in', 'failed');
            }
        } else {
            cb('No data passed in', 'failed');
        }
    });

    When('I favorite a direct message conversation', () => {
        const found = store.chats.find(x => x.id === chatId);
        found.should.be.ok;

        const added = store.myChats.addFavorite(found);
        added.should.be.true;
    });

    Then('it appears on top of others', (done) => {
        store.loadAllChats()
            .then(() => {
                when(() => store.myChats.loaded, () => {
                    const found = store.chats.find(x => x.id === chatId);
                    const index = store.myChats.favorites.indexOf(found);
                    index.should.be.equal(0);
                    done();
                });
            });
    });

    When('I unfavorite a direct message conversation', () => {
        const found = store.chats.find(x => x.id === chatId);
        found.should.be.ok;

        const removed = store.myChats.removeFavorite(found);
        removed.should.be.true;
    });

    Then('it appears in chronological order', (done) => {
        store.loadAllChats()
            .then(() => {
                when(() => store.myChats.loaded, () => {
                    const found = store.chats.find(x => x.id === chatId);
                    const index = store.myChats.favorites.indexOf(found);

                    index.should.be.equal(-1);
                    done();
                });
            });
    });
});
