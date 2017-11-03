@wip
Feature: Rooms
    Scenario: Leave room
        And belong to {a room}
        When I leave {a room}
        Then I should not be able to access {a room}