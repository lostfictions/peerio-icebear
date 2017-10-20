const defineSupportCode = require('cucumber').defineSupportCode;
const getAppInstance = require('../../helpers/appConfig');
const { when } = require('mobx');
const { asPromise } = require('../../../../src/helpers/prombservable');
const runFeature = require('../../helpers/runFeature');
const path = require('path');

defineSupportCode(({ Before, Then, When }) => {
    let app;
    let numberOfFilesUploaded;
    const other = '360mzhrj8thigc9hi4t5qddvu4m8in';
    const testDocument = 'test.txt';

    const findTestFile = () => {
        return app.fileStore.files.find(file => file.name === testDocument);
    };

    const getReceiver = () => {
        return new Promise((resolve) => {
            const receiver = new app.Contact(other);
            when(() => !receiver.loading, () => resolve(receiver));
        });
    };

    Before((testCase, done) => {
        app = getAppInstance();

        when(() => app.socket.connected, () => {
            app.fileStore.loadAllFiles();
            done();
        });
    });

    // Scenario: Upload
    When('I upload a file', (done) => {
        numberOfFilesUploaded = app.fileStore.files.length;
        console.log(`Files in storage: ${numberOfFilesUploaded}`);

        const file = `${__dirname}/${testDocument}`;
        const keg = app.fileStore.upload(file);

        when(() => keg.readyForDownload, done);
    });

    Then('I should see it in my files', () => {
        app.fileStore.files.length
            .should.be.equal(numberOfFilesUploaded + 1);

        findTestFile().should.be.ok;
    });


    // Scenario: Download
    When('I download the file', (done) => {
        const filePath = path.resolve(__dirname, `downloaded-${testDocument}`);
        findTestFile()
            .download(filePath, false)
            .then(done);
    });

    Then('I can access the file locally', () => {

    });


    // Scenario: Delete
    Then('I delete the file', () => {
        numberOfFilesUploaded = app.fileStore.files.length;
        return findTestFile().remove();
    });

    Then('it should be removed from my files', () => {
        findTestFile().deleted.should.be.true;
        return asPromise(app.fileStore.files, 'length', numberOfFilesUploaded - 1);
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
        app.fileStore.files
            .should.not.contain(x => x.name === testDocument);
    });
});
