@wip
Feature: 2 factor authentication
    Scenario: Enable 2FA
        When I enable 2FA
        Then I should receive a challenge