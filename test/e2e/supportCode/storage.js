const defineSupportCode = require('cucumber').defineSupportCode;
const { asPromise } = require('../../../src/helpers/prombservable');
const { runFeatureFromUsername, checkResult } = require('./helpers/runFeature');
const { waitForConnection, getFileStore, getContactWithName } = require('./client');
const fs = require('fs');

defineSupportCode(({ Before, Then, When }) => {
    const store = getFileStore();

    const testDocument = 'test.txt';
    const pathToUploadFrom = `${__dirname}/helpers/${testDocument}`;
    const pathToDownloadTo = `${__dirname}/helpers/downloaded-${testDocument}`;
    const fileInStore = () => store.files.find(file => file.name === testDocument);

    let numberOfFilesUploaded;
    const otherUser = '360mzhrj8thigc9hi4t5qddvu4m8in'; // todo: generate user

    Before({ tag: '@fileStoreLoaded' }, () => {
        return waitForConnection().then(store.loadAllFiles);
    });

    // Scenario: Upload
    When('I upload a file', () => {
        numberOfFilesUploaded = store.files.length;

        const keg = store.upload(pathToUploadFrom);
        return asPromise(keg, 'readyForDownload', true);
    });

    Then('I should see it in my files', () => {
        store.files.length.should.be.equal(numberOfFilesUploaded + 1);
        store.files.should.contain(x => x.name === testDocument);
    });


    // Scenario: Download
    When('I download the file', (done) => {
        fileInStore()
            .download(pathToDownloadTo, false)
            .then(done);
    });

    Then('I can access the file locally', (done) => {
        fs.stat(pathToDownloadTo, (err) => {
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
        return fileInStore().remove();
    });

    Then('it should be removed from my files', () => {
        fileInStore().deleted.should.be.true;
        return asPromise(store.files, 'length', numberOfFilesUploaded - 1);
    });


    // Scenario: Share
    When('I share it with a receiver', () => {
        return getContactWithName(otherUser)
            .then(contact => {
                return fileInStore().share(contact);
            });
    });

    Then('receiver should see it in their files', () => {
        return runFeatureFromUsername('Access shared file', otherUser)
            .then(checkResult);
    });

    Then('I should the shared file', () => {
        store.files.should.contain(x => x.name === testDocument);
    });


    // Scenario: Delete after sharing
    Then('it should be removed from receivers files', { timeout: 10000 }, () => {
        return runFeatureFromUsername('Deleted files', otherUser)
            .then(checkResult);
    });

    Then('I should not see deleted files', () => {
        store.files.should.not.contain(x => x.name === testDocument);
    });
});
