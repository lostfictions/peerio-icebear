@rooms
Feature: Rooms
    @registeredUser
    Scenario: Send room invite
        Given I am logged in
        When I create a room
        And  I invite another user
        Then they should get a room invite