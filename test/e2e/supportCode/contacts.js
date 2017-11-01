const defineSupportCode = require('cucumber').defineSupportCode;
const { receivedEmailInvite, confirmUserEmail } = require('./helpers/mailinatorHelper');
const { runFeature, checkResult } = require('./helpers/runFeature');
const { asPromise } = require('./../../../src/helpers/prombservable');
const { getContactStore } = require('./client');
const { otherUser } = require('./helpers/otherUser');

defineSupportCode(({ Given, Then, When }) => {
    const store = getContactStore();

    let contactFromUsername;
    const otherUserEmail = () => `${otherUser.id}@mailinator.com`;

    const contactLoaded = () => {
        contactFromUsername = store.getContact(otherUser.id);
        return asPromise(contactFromUsername, 'loading', false).delay(500);
    };

    // Scenario: Find contact
    Given(/I search for (a registered username|a registered email|an unregistered user)/, (someone) => {
        console.log(someone);
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
        return store.invite(otherUserEmail()).should.be.fulfilled;
    });

    Then('they are added in my invited contacts', () => {
        return contactLoaded()
            .then(() => store.invitedContacts.should.contain(c => c === contactFromUsername));
    });

    Then('they should receive an email invitation', () => {
        return receivedEmailInvite(otherUserEmail());
    });


    // Scenario: favorite a contact
    When('I favorite a registered user', () => {
        return contactLoaded()
            .then(() => {
                return store.addContact(otherUser)
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
        store.removeContact(otherUser.id);
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
        return store.invite((otherUserEmail()))
            .should.be.fulfilled;
    });

    When('they sign up', () => {
        const other = { username: otherUser.id };
        return runFeature('Create account with username', other)
            .then(checkResult);
    });

    When('they confirm their email', () => {
        return confirmUserEmail(otherUserEmail());
    });


    // Scenario: Remove favorite contact before email confirmation
    When('I remove the invitation', () => {
        return store.removeInvite(otherUserEmail());
    });
});
