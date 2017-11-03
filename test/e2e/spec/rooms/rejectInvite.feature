@wip
Feature: Rooms
    Scenario: Reject invite
        Given I am logged in
        When I receive an invitation
        And reject it
        Then notification will disappear