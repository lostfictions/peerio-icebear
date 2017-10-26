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
        Given I am an admin of {a room}
        And {person} has joined {a room} 
        When I kick out {person}
        Then {person} should not be able to access {a room} 
    
    Scenario: Promote member
        Given I am an admin of {a room}
        And {person} has joined {a room} 
        When I promote {person} to admin
        Then {person} should be admin
    
    Scenario: Demote member
        Given I am an admin of {a room}
        And {person} has joined {a room} 
        And {person} is admin of {a room} 
        When I demote them
        Then {person} should no longer be admin of {a room} 
