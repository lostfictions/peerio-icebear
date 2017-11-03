@wip
Feature: Chat
    Scenario: Start new chat
        Given I have never chatted with receiver before
        When I enter a new chat
        Then there should be no history
        And receiver should receive an invite
    
        