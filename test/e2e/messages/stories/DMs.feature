Feature: Direct messages
    As a user
    In order to communicate with others
    I want to send messages
    
    Background: 
        Given I am logged in

    Scenario: Create direct message
        When I create a direct message
        Then the receiver gets notified
    
    # also test more favs
    Scenario: Favorite direct message conversation
        Given I create a direct message
        When  I favorite a direct message conversation
        Then  it appears on top of others
    
    Scenario: Unfavorite direct message conversation
        Given I create a direct message
        And   I favorite a direct message conversation
        When  I unfavorite a direct message conversation
        Then  it appears in chronological order
    
    Scenario: Send/receive message in direct message conversation
        When I send a direct message
        And  the message appears in the chat
        Then the receiver gets notified
        And  the receiver can read the message
    
    Scenario: Send/receive read receipt
        Given I send a direct message
        When  the receiver reads the message
        Then  I view a read receipt
    
    






    