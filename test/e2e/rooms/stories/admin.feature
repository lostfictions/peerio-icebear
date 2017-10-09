Feature: Rooms
    As a user
    In order to communicate with a group
    I want to access rooms
    
    Background: 
        Given I am logged in

    Scenario: Create room
        When I create a room
        Then I can enter the room
    
    #same as add participant?
    Scenario: Send invite
        When I create a room
        And I invite {other users}
        Then {other users} should get notified
    
    Scenario: Delete room
        Given I am an admin of {a room}
        When I delete a room
        Then nobody should be able to access {a room}
    
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
