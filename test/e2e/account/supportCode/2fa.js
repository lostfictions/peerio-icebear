const defineSupportCode = require('cucumber').defineSupportCode;
const getNewAppInstance = require('../../config');
const { when } = require('mobx');

defineSupportCode(({ Before, Given, Then, When }) => {
    let app;
    let secret = null;

    Before((testCase, done) => {
        app = getNewAppInstance();
        when(() => app.socket.connected, done);
    });


    // Scenario: Enable 2FA
    When('I enable 2FA', (done) => {
        app.User.current
            .setup2fa()
            .then((s) => { secret = s; })
            .then(done);
    });

    Then('I should receive a challenge', () => {
        secret.should.not.be.null;
        console.log(`secret is: ${secret}`);
    });


    // Scenario: Try to enable 2FA when it's already active
    When('2FA is already enabled', () => {
        app.User.current.twoFAEnabled = true;
    });

    Then('I should receive an error saying {err}', (err) => {
        return app.User.current
            .setup2fa()
            .should.be.rejectedWith(err);
    });


    // Scenario: Disable 2FA
    Then('I can disable 2FA', (done) => {
        done(null, 'pending');
        // First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object
        // app.User.current
        //     .disable2fa()
        //     .then(() => {
        //         app.User.current.twoFAEnabled.should.be.true;
        //     })
        //     .then(done);
    });
});
