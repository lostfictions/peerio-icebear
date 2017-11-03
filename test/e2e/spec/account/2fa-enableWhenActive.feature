@wip
Feature: 2 factor authentication
    Scenario: Try to enable 2FA when already active
        Given I am logged in
        Given 2FA is already enabled
        Then I should receive an error saying 2fa already enabled on this account.