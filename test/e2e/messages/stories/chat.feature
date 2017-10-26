Feature: Chat
    
    Background: 
        Given I am logged in

    Scenario: Start new chat
        Given I have never chatted with receiver before
        When I enter a new chat
        Then there should be no history
        And receiver should receive an invite
    
    Scenario: Restart previous chat
        Given I have chatted with receiver before
        When I enter a new chat
        Then I should see our chat history
        And receiver should receive an invite
    
    Scenario: Send files in a chat
        Given I am in a chat with {receiver}
        When I send {receiver} {a file}
        Then {receiver} should be able download {a file} contents
    
        