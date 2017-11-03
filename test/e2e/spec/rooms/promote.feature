@rooms
Feature: Rooms
    @registeredUser
    Scenario: Promote member
        Given I am logged in
        Given I create a room
        And   someone has joined the room 
        Then  I can promote them to admin