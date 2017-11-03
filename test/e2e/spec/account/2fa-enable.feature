@wip
Feature: 2 factor authentication
    Scenario: Enable 2FA
        Given I am logged in
        When I enable 2FA
        Then I should receive a challenge