Feature: Channels and chat
Users were confused with the idea that both DMs and Rooms can be group chats.
    
    Scenario: DM's are always 1 on 1
        Given I am a logged in user
        When I enter a DM type of chat
        Then I see only myself and the other recipient
