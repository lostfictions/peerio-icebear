@wip
Feature: Rooms
    Scenario: Leave room
        Given I am logged in
        And belong to {a room}
        When I leave {a room}
        Then I should not be able to access {a room}