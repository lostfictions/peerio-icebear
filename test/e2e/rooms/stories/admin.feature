Feature: Rooms
    As a user
    In order to communicate with a group
    I want to access rooms
    
    Background: 
        Given I am logged in

    Scenario: Create room
        When I create a room
        Then I can rename the room
        And  I can change the room purpose
    
    Scenario: Send invite
        When I create a room
        And  I invite another user
        Then they should get a room invite
    
    Scenario: Delete room
        Given I create a room
        Then  I can delete a room
    
    Scenario: Kick member
        Given I create a room
        And   someone has joined the room 
        When  I them kick out
        Then  they should not be in the room anymore
    
    Scenario: Promote member
        Given I create a room
        And   someone has joined the room 
        Then  I can promote them to admin
    
    Scenario: Demote member
        Given I create a room
        And   someone has joined the room 
        And   I can promote them to admin
        Then  I can demote them as admin
