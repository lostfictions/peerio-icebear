@wip
Feature: Chat
    Scenario: Start new chat
    Scenario: Send files in a chat
        Given I am in a chat with receiver
        When I send receiver a file
        Then receiver should be able download a file contents
    
        