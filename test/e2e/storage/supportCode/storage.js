const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    const fileToUpload = 'test.txt';

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });

    // Scenario: Upload
    When('I upload a file', { timeout: 25000 }, (done) => {
        app.fileStore.loadAllFiles();

        const file = `${__dirname}/${fileToUpload}`;
        const keg = app.fileStore.upload(file);

        when(() => keg.readyForDownload, done);
    });

    Then('I should see it in my files', () => {
        app.fileStore.files.length
            .should.be.above(1);

        app.fileStore.files
            .find(x => x.name === fileToUpload)
            .should.be.ok;
    });
});
