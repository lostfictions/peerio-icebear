Feature: Favorite contacts
    As a user
    In order to reach my friends faster
    I want to have favorite contacts
    
    Background: 
        Given I am logged in

    @registeredUser
    Scenario: Favorite a contact
        When I favorite a registered user
        Then they will be in my favorite contacts

    @registeredUser
    Scenario: Unfavorite a contact 
        Given I favorite a registered user
        And   they will be in my favorite contacts
        When  I unfavorite them
        Then  they will not be in my favorites

    @unregisteredUser
    Scenario: Create favorite contact from invited user
        Given I invite an unregistered user
        And   they sign up
        And   they confirm their email
        Then  they will be in my favorite contacts
    
    @unregisteredUser
    Scenario: Remove favorite contact before email confirmation
        Given I invite an unregistered user
        But   I remove the invitation
        When  they sign up
        And   they confirm their email
        Then  they will not be in my favorites