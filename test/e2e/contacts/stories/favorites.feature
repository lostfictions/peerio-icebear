Feature: Favorite contacts
    As a user
    In order to reach my friends faster
    I want to have favorite contacts
    
    Background: 
        Given I am logged in

    Scenario: Create favourite contact on invited email confirmation (sender and receiver)
        Given I confirm my email
        When  I send an invitation to hello@mailinator.com
        And   they confirm their email
        Then  they will be in my favorite contacts
    
     Scenario: Remove favourite contact before email confirmation
        When I send an invitation to hello@mailinator.com
        And  they confirm their email
        But  I unfavorite them
        Then they will not be in my favorites

    Scenario: Favourite a contact
        When I favourite them
        Then they will be in my favorite contacts

    Scenario: Unfavorite a contact 
        When I unfavorite them
        Then they will not be in my favorites