@wip
Feature: Rooms
    Scenario: List members
        Given I am logged in
        When I enter {a room}
        Then I should see all {room} members