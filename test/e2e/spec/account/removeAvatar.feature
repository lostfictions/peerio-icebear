Feature: User profile
    Scenario: Remove avatar
        When I delete my avatar
        Then my avatar should be empty