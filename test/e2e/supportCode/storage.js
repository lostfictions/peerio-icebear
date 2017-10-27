const defineSupportCode = require('cucumber').defineSupportCode;
const { when } = require('mobx');
const { asPromise } = require('../../../src/helpers/prombservable');
const runFeature = require('./helpers/runFeature');
const { waitForConnection, getFileStore, getContactWithName } = require('./client');
const fs = require('fs');

defineSupportCode(({ Before, Then, When }) => {
    const store = getFileStore();

    const testDocument = 'test.txt';
    const pathToUploadFrom = `${__dirname}/helpers/${testDocument}`;
    const pathToDownloadTo = `${__dirname}/helpers/downloaded-${testDocument}`;
    const fileInStore = () => store.files.find(file => file.name === testDocument);

    let numberOfFilesUploaded;
    const other = '360mzhrj8thigc9hi4t5qddvu4m8in';

    Before(() => {
        return waitForConnection().then(store.loadAllFiles);
    });

    // Scenario: Upload
    When('I upload a file', (done) => {
        numberOfFilesUploaded = store.files.length;
        const keg = store.upload(pathToUploadFrom);
        when(() => keg.readyForDownload, done);
    });

    Then('I should see it in my files', () => {
        store.files.length
            .should.be.equal(numberOfFilesUploaded + 1);

        fileInStore().should.be.ok;
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
    When('I share it with a receiver', (done) => {
        getContactWithName(other)
            .then(receiver => {
                return fileInStore()
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
        fileInStore()
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
        store.files.should.not.contain(x => x.name === testDocument);
    });
});
