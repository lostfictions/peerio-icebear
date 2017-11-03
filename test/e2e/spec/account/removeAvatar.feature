Feature: User profile
    Scenario: Remove avatar
        Given I am logged in
        When I delete my avatar
        Then my avatar should be empty