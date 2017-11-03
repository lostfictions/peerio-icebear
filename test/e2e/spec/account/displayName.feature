Feature: User profile
    Scenario: Update display name
        Given I am logged in
        When I change my display name
        Then it should be updated