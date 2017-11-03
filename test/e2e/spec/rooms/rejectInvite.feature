@wip
Feature: Rooms
    Scenario: Reject invite
        When I receive an invitation
        And reject it
        Then notification will disappear