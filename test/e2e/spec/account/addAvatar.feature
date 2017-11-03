Feature: User profile
    Scenario: Add avatar successfully
        Given I am logged in
        When I upload an avatar
        Then it should appear in my profile