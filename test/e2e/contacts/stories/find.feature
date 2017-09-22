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

    Scenario: Fetch profile
        When ???
        Then ???

    Scenario: Send invite email
        Given I search for Alice
        And no profiles are found
        And I send an invitation
        Then I will see Alice in my Invited list