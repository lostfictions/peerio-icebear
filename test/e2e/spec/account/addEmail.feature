Feature: User account access
    Scenario: Add new email
        Given I am logged in
        When I add a new email
        When I am logged in
        Then new email is in my addresses