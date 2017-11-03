Feature: User account access
    Scenario: Sign in
        Given I am a returning customer
        When I sign in
        Then I have access to my account
    