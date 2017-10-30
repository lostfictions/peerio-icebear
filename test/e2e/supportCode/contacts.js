const defineSupportCode = require('cucumber').defineSupportCode;
const { receivedEmailInvite, confirmUserEmail } = require('./helpers/mailinatorHelper');
const { runFeature, checkResult, checkResultAnd } = require('./helpers/runFeature');
const { getRandomUsername } = require('./helpers/usernameHelper');
const { asPromise } = require('./../../../src/helpers/prombservable');
const { getContactStore } = require('./client');

defineSupportCode(({ Before, Given, Then, When }) => {
    const store = getContactStore();

    let contactFromUsername;
    let otherUsername;
    let registeredUsername, registeredEmail;
    let unregisteredUsername, unregisteredEmail;

    const assignUnregisteredUser = () => {
        unregisteredUsername = getRandomUsername();
        unregisteredEmail = `${unregisteredUsername}@mailinator.com`;
    };

    const assignRegisteredUser = (data) => {
        registeredUsername = data.username;
        registeredEmail = `${registeredUsername}@mailinator.com`;
    };

    const assignOtherUsername = (someone) => {
        if (someone === 'a registered username') {
            otherUsername = registeredUsername;
        }
        if (someone === 'a registered email') {
            otherUsername = registeredEmail;
        }
        if (someone === 'an unregistered user') {
            otherUsername = unregisteredEmail;
        }
    };

    const contactLoaded = () => {
        contactFromUsername = store.getContact(otherUsername);
        return asPromise(contactFromUsername, 'loading', false);
    };

    Before('@confirmedUser', () => {
        return runFeature('Account creation')
            .then(checkResultAnd)
            .then(data => {
                assignRegisteredUser(data);
                return confirmUserEmail(registeredEmail);
            });
    });

    Before('@unregisteredUser', () => {
        assignUnregisteredUser();
    });

    // Scenario: Find contact
    Given(/I search for (a registered username|a registered email|an unregistered user)/, (someone) => {
        assignOtherUsername(someone);
        return contactLoaded();
    });

    When('the contact exists', () => {
        contactFromUsername.notFound.should.be.false;
    });

    Then('the contact is added in my contacts', () => {
        store.contacts.should.contain(c => c === contactFromUsername);
    });


    // Scenario: Send invite email
    When('no profiles are found', () => {
        contactFromUsername.notFound.should.be.true;
    });

    When('I send an invitation to them', () => {
        return store.invite(otherUsername).should.be.fulfilled;
    });

    Then('they are added in my invited contacts', () => {
        return contactLoaded()
            .then(() => store.invitedContacts.should.contain(c => c === contactFromUsername));
    });

    Then('they should receive an email invitation', () => {
        return receivedEmailInvite(otherUsername);
    });


    // Scenario: favorite a contact
    When('I favorite a registered user', () => {
        otherUsername = registeredUsername;
        return contactLoaded()
            .then(() => {
                return store.addContact(registeredUsername)
                    .then(result => result.should.be.true);
            });
    });

    Then('they will be in my favorite contacts', () => {
        return contactLoaded()
            .then(() => {
                return asPromise(contactFromUsername, 'isAdded', true)
                    .then(() => store.addedContacts.should.contain(contactFromUsername));
            });
    });


    // Scenario: Unfavorite a contact
    When('I unfavorite them', () => {
        store.removeContact(otherUsername);
    });

    Then('they will not be in my favorites', () => {
        return contactLoaded()
            .then(() => {
                store.addedContacts
                    .should.not.contain(c => c === contactFromUsername);
            });
    });


    // Scenario: Create favorite contact
    When('I invite an unregistered user', () => {
        otherUsername = unregisteredUsername;
        return store.invite(unregisteredEmail)
            .should.be.fulfilled;
    });

    When('they sign up', () => {
        const otherUser = { username: otherUsername };
        return runFeature('Create account with username', otherUser)
            .then(checkResult);
    });

    When('they confirm their email', () => {
        return confirmUserEmail(unregisteredEmail);
    });


    // Scenario: Remove favorite contact before email confirmation
    When('I remove the invitation', () => {
        return store.removeInvite(unregisteredEmail);
    });
});
