Feature: Rooms
    As a user
    In order to communicate with a group
    I want to access rooms
    
    Background: 
        Given I am logged in

    Scenario: Accept invite
        When I receive an invitation
        And accept it
        Then notification will disappear
        And I should access the room
    
    Scenario: List members
        When I enter {a room}
        Then I should see all {room} members
    
    Scenario: Reject invite
        When I receive an invitation
        And reject it
        Then notification will disappear
    
    Scenario: Leave room
        And belong to {a room}
        When I leave {a room}
        Then I should not be able to access {a room}

    Scenario: Can not create more than 3 rooms
        Given I created 3 rooms
        When I try to create {another room} 
        Then {another room} should not be created