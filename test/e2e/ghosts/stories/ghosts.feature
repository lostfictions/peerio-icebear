Feature: Ghosts
    
    Background: 
        Given I am logged in

    Scenario: Receiving my ghost mails
        When I request my ghosts
        Then I should receive a list of messages
    
    Scenario: Send a ghost
        When I compose a new ghost message
        And attach {a file}
        And {receiver} is not a user
        Then {receiver} should be able to read the message
    
    