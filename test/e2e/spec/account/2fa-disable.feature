@wip
Feature: 2 factor authentication
    Scenario: Disable 2FA
        Given 2FA is already enabled
        Then I can disable 2FA

# todo:        
# Sign in with backup code
# Sign in with 2FA code
# Regenerate backup codes
# Trust device   