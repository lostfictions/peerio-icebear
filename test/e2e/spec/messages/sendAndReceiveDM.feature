@registeredUser
Feature: Direct messages
    Scenario: Send/receive message in direct message conversation
        Given I am logged in
        When I create a direct message
        And  I send a direct message
        Then the message appears in the chat
        And  the receiver can read the message