const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let blob = null;
    let url = '';

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });


    // Scenario: Update display name
    When('I change my display name', () => {
        app.User.current.firstName = 'Alice';
        app.User.current.lastName = 'Carroll';

        return app.User.current.saveProfile(); // Invalid increment of the keg version
    });

    Then('it should be updated', () => {
        app.User.current.firstName.should.be('Alice');
        app.User.current.lastName.should.be('Carroll');
    });


    // Scenario: Add avatar successfully
    When('I upload an avatar', () => {
        app.contactStore.getContact(app.User.current.username)
            .hasAvatar
            .should.be.false;

        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('it should appear in my profile', () => {
        app.contactStore.getContact(app.User.current.username)
            .hasAvatar
            .should.be.true;
    });


    // Scenario: Add avatar when another one is being loaded
    When('another avatar upload is in progress', () => {
        app.User.current.savingAvatar = true;
        blob = null;
    });

    Then('I should get an error saying {err}', (err) => {
        return app.User.current
            .saveAvatar(blob)
            .should.be.rejectedWith(err);
    });


    // Scenario: Add avatar with wrong number of pictures
    When('the upload does not contain {int} blobs', (int) => {
        blob = { small: '' };
    });


    // Scenario: Add avatar with malformed payload
    When('the payload is malformed', () => {
        blob = ['', ''];
    });


    // Scenario: Update avatar
    Given('I have an avatar', (done) => {
        blob = [new ArrayBuffer(42), new ArrayBuffer(42)];

        app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled
            .then(() => {
                url = app.contactStore
                    .getContact(app.User.current.username)
                    .largeAvatarUrl;
            })
            .then(done);
    });

    When('I upload a new avatar', () => {
        blob = [new ArrayBuffer(43), new ArrayBuffer(43)];

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('the new avatar should be displayed', () => {
        const newURl = app.contactStore
            .getContact(app.User.current.username)
            .largeAvatarUrl;

        newURl.should.not.equal(url);
    });


    //  Scenario: Remove avatar
    When('I delete my avatar', () => {
        blob = null;

        return app.User.current
            .saveAvatar(blob)
            .should.be.fulfilled;
    });

    Then('my avatar should be empty', () => {
        app.contactStore.getContact(app.User.current.username)
            .hasAvatar
            .should.be.false;
    });
});
