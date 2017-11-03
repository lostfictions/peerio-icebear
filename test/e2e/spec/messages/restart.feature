@wip
Feature: Chat
    Scenario: Restart previous chat
        Given I have chatted with receiver before
        When I enter a new chat
        Then I should see our chat history
        And receiver should receive an invite
        