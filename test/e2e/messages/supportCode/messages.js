const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('../../helpers/appConfig');
const { when } = require('mobx');
const runFeature = require('../../helpers/runFeature');
// const { getRandomUsername } = require('../../helpers/usernameHelper');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Then, When }) => {
    const app = getAppInstance();
    const store = app.chatStore;
    const other = 'gft99kr2e377zdgwygbjjonihd9x9y';
    let chatId;
    const message = 'Hello world';
    let numberOfMessages = -1;

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
        runFeature('Receive chat request from account', data)
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Then('a chat request pops up', (cb) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
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

    Then('I send a direct message', (done) => {
        numberOfMessages = store.activeChat.messages.length;
        store.activeChat.sendMessage(message)
            .catch(e => console.log(e))
            .then(done);
    });

    Then('the message appears in the chat', () => {
        return asPromise(store.activeChat.messages, 'length', numberOfMessages + 1);
    });

    Then('the receiver can read the message', (cb) => {
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
            chatId = data.chatId;

            if (chatId) {
                store.loadAllChats()
                    .then(() => {
                        when(() => store.loaded, () => {
                            const found = store.activeChat.messages.find(x => x.text === message);
                            found.should.be.ok;
                            cb();
                        });
                    });
            } else {
                cb('No message id passed in', 'failed');
            }
        } else {
            cb('No data passed in', 'failed');
        }
    });

    Then('I view a read receipt', () => {
    });
});
