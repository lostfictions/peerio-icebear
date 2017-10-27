const defineSupportCode = require('cucumber').defineSupportCode;
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');
const getAppInstance = require('./helpers/appConfig');
const runFeature = require('./helpers/runFeature');
const { waitForConnection, getFileStore } = require('./client');
const path = require('path');
const fs = require('fs');

defineSupportCode(({ Before, Then, When }) => {
    const store = getFileStore();
    let numberOfFilesUploaded;
    const testDocument = 'test.txt';
    const other = '360mzhrj8thigc9hi4t5qddvu4m8in';

    const findTestFile = () => {
        return store.files.find(file => file.name === testDocument);
    };

    const getReceiver = () => {
        return new Promise((resolve) => {
            const app = getAppInstance();
            const receiver = new app.Contact(other);
            when(() => !receiver.loading, () => resolve(receiver));
        });
    };

    Before(() => {
        return waitForConnection().then(store.loadAllFiles);
    });

    // Scenario: Upload
    When('I upload a file', (done) => {
        numberOfFilesUploaded = store.files.length;
        console.log(`Files in storage: ${numberOfFilesUploaded}`);

        const file = `${__dirname}/helpers/${testDocument}`;
        const keg = store.upload(file);

        when(() => keg.readyForDownload, done);
    });

    Then('I should see it in my files', () => {
        store.files.length
            .should.be.equal(numberOfFilesUploaded + 1);

        findTestFile().should.be.ok;
    });


    // Scenario: Download
    When('I download the file', (done) => {
        const filePath = path.resolve(`${__dirname}/helpers/`, `downloaded-${testDocument}`);
        findTestFile()
            .download(filePath, false)
            .then(done);
    });

    Then('I can access the file locally', (done) => {
        const filePath = path.resolve(`${__dirname}/helpers/`, `downloaded-${testDocument}`);
        fs.stat(filePath, (err) => {
            if (err == null) {
                done();
            } else {
                done(err, 'failed');
            }
        });
    });


    // Scenario: Delete
    Then('I delete the file', () => {
        numberOfFilesUploaded = store.files.length;
        return findTestFile().remove();
    });

    Then('it should be removed from my files', () => {
        findTestFile().deleted.should.be.true;
        return asPromise(store.files, 'length', numberOfFilesUploaded - 1);
    });


    // Scenario: Share
    When('I share it with a receiver', (done) => {
        getReceiver()
            .then(receiver => {
                return findTestFile()
                    .share(receiver)
                    .then(() => done());
            });
    });

    Then('receiver should see it in their files', (cb) => {
        const receiver = { username: other, passphrase: 'secret secrets' };
        runFeature('Access my files', receiver)
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Then('I should see my files', () => {
        findTestFile()
            .should.not.be.null
            .and.should.be.ok;
    });


    // Scenario: Delete after sharing
    Then('it should be removed from receivers files', (cb) => {
        const receiver = { username: other, passphrase: 'secret secrets' };
        runFeature('Deleted files', receiver)
            .then(result => {
                if (result.succeeded) {
                    cb(null, 'done');
                } else {
                    cb(result.errors, 'failed');
                }
            });
    });

    Then('I should not see deleted files', () => {
        store.files
            .should.not.contain(x => x.name === testDocument);
    });
});
