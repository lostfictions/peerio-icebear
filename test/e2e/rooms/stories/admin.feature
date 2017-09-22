Feature: Rooms
    As a user
    In order to communicate with a group
    I want to access rooms
    
    Background: 
        Given I am logged in

    Scenario: Create room
        When I create a room
        Then I can enter the room
    
    Scenario: Send invite
        When I create a room
        And I invite {other users}
        Then {other users} should get notified
    
    Scenario: Delete room
        Given own {a room} ?
        When I delete {a room}
        Then nobody should be able to access {a room}
    
    Scenario: Kick member
        Given own {a room} ?
        And {person} has joined {a room} 
        When I kick out {person}
        Then {person} should not be able to access {a room} 
    
    Scenario: Promote member
        Given I am logged in
        And ???
        When ???
        Then ???
    
    Scenario: Demote member
        Given I am logged in
        And ???
        When ???
        Then ???