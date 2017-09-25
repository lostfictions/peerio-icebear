Feature: Direct messages
    As a user
    In order to communicate with others
    I want to send messages
    
    Background: 
        Given I am logged in

    Scenario: Create DM
        When I create a DM
        Then the receiver gets notified
    
    Scenario: Favourite DM
        When I favourite a DM
        Then ???
    
    Scenario: Unfavourite DM
        When I unfavourite a DM
        Then ???
    
    Scenario: Send message in DM
        When I send a message
        Then the message appears in the chat
    
    Scenario: Receive message in DM
        When someone else messages me
        Then the message appears in the chat
        And I get notified that I have 1 unread message
    
    Scenario: Send read receipt
        When I read a message
        Then the other user should get notified
    
    Scenario: Receive read receipt
        When I send a message
        And the other user reads it
        Then I should get notified
    
    






    