Feature: User account access
    Scenario: Add new email
        When I add a new email
        And  I am logged in
        Then new email is in my addresses