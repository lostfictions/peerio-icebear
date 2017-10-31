const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('./helpers/appConfig');
const { when } = require('mobx');
const { runFeature, checkResult } = require('./helpers/runFeature');
const { getChatStore, getContactWithName } = require('./client');
const { asPromise } = require('./../../../src/helpers/prombservable');

defineSupportCode(({ Given, Then, When }) => {
    const app = getAppInstance();
    const store = getChatStore();
    const otherUsername = 'gft99kr2e377zdgwygbjjonihd9x9y';
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

    const getPropFromEnv = (prop) => {
        if (process.env.peerioData) {
            const data = JSON.parse(process.env.peerioData);
            const found = data[prop];

            if (found) {
                return found;
            }
            throw new Error('Prop not present');
        }
        throw new Error('No data passed in');
    };

    const loadChats = () => {
        return store.loadAllChats()
            .then(() => asPromise(store, 'loaded', true));
    };

    // Scenario: Create direct message
    When('I create a direct message', () => {
        return getContactWithName(otherUsername)
            .then(user => startChatWith(user).then(assignChatId));
    });

    Then('the receiver gets notified', () => {
        const user = { username: otherUsername, passphrase: 'secret secrets', chatId };
        return runFeature('Receive chat request from account', user)
            .then(checkResult);
    });

    Then('a chat request pops up', () => {
        chatId = getPropFromEnv('chatId');
        return loadChats()
            .then(() => {
                const found = store.chats.find(x => x.id === chatId);
                found.should.be.ok;
            });
    });

    const findChatWithId = (id) => store.chats.find(x => x.id === id);

    const indexOfChat = (id) => {
        const found = findChatWithId(id);
        const index = store.myChats.favorites.indexOf(found);

        return index;
    };

    When('I favorite a direct message conversation', () => {
        const found = findChatWithId(chatId);
        found.should.be.ok;

        const added = store.myChats.addFavorite(found);
        added.should.be.true;
    });

    Then('it appears on top of others', () => {
        return loadChats()
            .then(() => indexOfChat(chatId).should.be.equal(0));
    });

    When('I unfavorite a direct message conversation', () => {
        const found = findChatWithId(chatId);
        found.should.be.ok;

        const removed = store.myChats.removeFavorite(found);
        removed.should.be.true;
    });

    Then('it appears in chronological order', () => {
        return loadChats()
            .then(() => indexOfChat(chatId).should.be.equal(-1));
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

    Then('the receiver can read the message', () => {
        const data = { username: otherUsername, passphrase: 'secret secrets', chatId };
        return runFeature('Receive new message from account', data)
            .then(checkResult);
    });

    Then('I can read my messages', () => {
        chatId = getPropFromEnv('chatId'); // todo - need chatId here?
        return loadChats()
            .then(() => {
                const found = store.activeChat.messages.find(x => x.text === message);
                found.should.be.ok;
            });
    });

    Then('the receiver reads the message', () => {
        const data = { username: otherUsername, passphrase: 'secret secrets', chatId };
        runFeature('Read new message from account', data)
            .then(checkResult);
    });

    Then('I read my messages', { timeout: 20000 }, () => {
        chatId = getPropFromEnv('chatId');

        app.clientApp.isFocused = true;
        app.clientApp.isInChatsView = true;

        return store.loadAllChats().delay(5000);
    });

    Then('I view a read receipt', (done) => {
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
