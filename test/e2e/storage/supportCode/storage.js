const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let numberOfFilesUploaded;
    const testDocument = 'test.txt';

    const findTestFile = () => {
        return app.fileStore.files.find(file => file.name === testDocument);
    };

    Before((testCase, done) => {
        app = getNewAppInstance();

        asPromise(app.socket, 'connected', true)
            .then(() => app.fileStore.loadAllFiles())
            .then(done);
    });

    // Scenario: Upload
    When('I upload a file', (done) => {
        numberOfFilesUploaded = app.fileStore.files.length;

        const file = `${__dirname}/${testDocument}`;
        const keg = app.fileStore.upload(file);

        when(() => keg.readyForDownload, done);
    });

    Then('I should see it in my files', () => {
        app.fileStore.files.length
            .should.be.equal(numberOfFilesUploaded + 1);

        findTestFile().should.be.ok;
    });

    When('I download a file', (done) => {
        findTestFile()
            .download(__dirname, true)
            .then(done);
    });


    Then('I can access a file locally', () => {

    });

    Then('I delete a file', () => {
        numberOfFilesUploaded = app.fileStore.files.length;
        return findTestFile().remove();
    });

    Then('it should be removed from my files', () => {
        findTestFile().deleted.should.be.true;
        return asPromise(app.fileStore.files, 'length', numberOfFilesUploaded - 1);
    });
});
