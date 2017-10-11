const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');
const { asPromise } = require('../../../../src/helpers/prombservable');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let numberOfFilesUploaded;
    const other = 'ubeugrp7kaes5yjk479wb4zyiszjra';
    const testDocument = 'test.txt';

    const findTestFile = () => {
        return app.fileStore.files.find(file => file.name === testDocument);
    };

    Before((testCase, done) => {
        app = getNewAppInstance();

        when(() => app.socket.connected, () => {
            app.fileStore.loadAllFiles();
            done();
        });
    });

    // Scenario: Upload
    When('I upload a file', (done) => {
        asPromise(app.fileStore, 'loading', false).then(() => {
            numberOfFilesUploaded = app.fileStore.files.length;

            const file = `${__dirname}/${testDocument}`;
            const keg = app.fileStore.upload(file);

            when(() => keg.readyForDownload, done);
        });
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

    When('I share a file with a receiver', () => {
        const receiver = new app.Contact(other);
        return findTestFile().share(receiver); // Cannot read property 'buffer' of null
    });

    Then('receiver should see it in their files', () => {
        console.log(findTestFile());
    });
});
