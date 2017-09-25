Feature: Find contacts
    As a user
    In order to communicate with others
    I want to access my contacts
    
    Background: 
        Given I am logged in

    Scenario: Find contact by username
        When I search for Alice
        Then I receive a contact with the username Alice
    
    Scenario: Find contact by email
        When I search for Alice
        Then I receive a contact with the email Alice

    Scenario: Remove contact
        When I remove Alice from my contacts
        Then "Alice" should not appear in my contacts list

    Scenario: Send invite email
        Given I search for Alice
        And no profiles are found
        And I send an invitation
        Then I will see Alice in my Invited list

    Scenario: Filters
        Given "Alice" and "Bob" are my contacts
        And "Alice" has not joined yet
        When I set the filter to 'added'
        Then "Bob" should appear in my contact list
    
    