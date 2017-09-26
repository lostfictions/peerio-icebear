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
    
    Scenario: Maxed chat limit
        Given I have reached the channel limit
        When I enter a new chat
        Then I should be notified
    
     Scenario: Rename a chat
         Given I am present in a chat
         When I rename it
         Then the chat name should be changed
     
    Scenario: Change purpose of chat
        Given I am present in a chat
        When I change the purpose
        Then the chat purpose should be changed
    
    Scenario: Send files in a chat
        Given I am in a chat with {receiver}
        When I send {receiver} {a file}
        Then {receiver} should be able download {a file} contents
    
        