@wip
Feature: Rooms
    Scenario: Can not create more than 3 rooms
        Given I am logged in
        Given I created 3 rooms
        When I try to create {another room} 
        Then {another room} should not be created