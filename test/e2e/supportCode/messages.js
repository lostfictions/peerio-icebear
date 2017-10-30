const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('./helpers/appConfig');
const { when } = require('mobx');
const { runFeature, checkResult } = require('./helpers/runFeature');
const { getChatStore, getContactWithName } = require('./client');
const { asPromise } = require('./../../../src/helpers/prombservable');

defineSupportCode(({ Given, Then, When }) => {
    const app = getAppInstance();
    const store = getChatStore();
    const other = 'gft99kr2e377zdgwygbjjonihd9x9y';
    let chatId;
    const message = 'Hello world';
    let numberOfMessages = -1;

    const assignChatId = (id) => { chatId = id; };

    const startChatWith = (user) => {
        const chat = store.startChat([user]);

        return asPromise(chat, 'added', true)
            .delay(500)
            .then(() => Promise.resolve(chat.id));
    };

    // Scenario: Create direct message
    When('I create a direct message', () => {
        return getContactWithName(other)
            .then(user => startChatWith(user).then(assignChatId));
    });

    Then('the receiver gets notified', () => {
        const data = { username: other, passphrase: 'secret secrets', chatId };
        return runFeature('Receive chat request from account', data)
            .then(checkResult);
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
        runFeature('Receive new message from account', data)
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

    Then('the receiver reads the message', { timeout: 10000 }, (cb) => {
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

    Then('I read my messages', { timeout: 20000 }, (cb) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            chatId = data.chatId;

            if (chatId) {
                app.clientApp.isFocused = true;
                app.clientApp.isInChatsView = true;
                store.loadAllChats()
                    .then(() => {
                        when(() => store.loaded, () => {
                            Promise.delay(5000).then(cb);
                        });
                    });
            } else {
                cb('No message id passed in', 'failed');
            }
        } else {
            cb('No data passed in', 'failed');
        }
    });

    Then('I view a read receipt', { timeout: 10000 }, (done) => {
        const chat = store.chats.find(x => x.id === chatId);
        const found = chat.messages.find(x => x.text === message);
        when(() => found.receipts, () => {
            console.log(found.receipts);
            done();
        });
    });

    Given('I have never chatted with receiver before', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    When('I enter a new chat', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    Then('there should be no history', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    Then('receiver should receive an invite', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    Given('I have chatted with receiver before', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    When('I enter a new chat', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    Then('I should see our chat history', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    Then('receiver should receive an invite', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    Given('I am in a chat with {string}', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });


    When('I send receiver a file', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    Then('receiver should be able download a file contents', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    Given('I am in a chat with receiver', (callback) => {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });
});
