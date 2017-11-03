@wip
Feature: Rooms
    Scenario: Accept invite
        When I receive an invitation
        And accept it
        Then notification will disappear
        And I should access the room