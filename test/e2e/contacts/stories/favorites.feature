Feature: Favorite contacts
    As a user
    In order to reach my friends faster
    I want to have favorite contacts
    
    Background: 
        Given I am logged in

    Scenario: Create favourite contact on invited email confirmation (sender and receiver)
        Given I confirm my email
        When I invite a new user over email
        And they confirm their email
        Then the new user will be added in my favorite contacts
    
    Scenario: Favourite a contact
        When I favourite a contact
        Then their name will appear in my favorite contacts

    Scenario: Unfavourite a contact 
        When I unfavourite a contact
        Then their name be removed from my favorite contacts