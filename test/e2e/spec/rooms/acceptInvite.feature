@wip
Feature: Rooms
    Scenario: Accept invite
        Given I am logged in
        When I receive an invitation
        And accept it
        Then notification will disappear
        And I should access the room