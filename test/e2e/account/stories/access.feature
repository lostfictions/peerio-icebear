Feature: User account access
    As a customer
    In order to use the app
    I want to have an account
    
    Scenario: Account creation
        Given I am a new customer
        When I successfully create a new account
        Then I will be logged in

    Scenario: Account deletion
        Given I am a registered user
        When I delete my acccount
        Then I should receive a confirmation

    Scenario: Sign in
        Given I am a returning customer
        When I sign in
        Then I have access to my account
    
    Scenario: Sign out
        Given I am logged in
        When I sign out
        Then I can not access my account
    
    Scenario: Email confirmation
        Given I'm a new user
        When I finish creating a new account
        Then I receive an email asking to confirm it
    
    Scenario: Change primary email
        Given I am logged in
        And my email addresses are "one@test.com" and "two@test.com"
        And "one@test.com" is the primary address
        When I choose "two@test.com" to be the primary email
        Then the primary email should be updated to "two@test.com"
    
    Scenario: Add new email
        Given I am logged in
        When hello123@test.com is added in my email addresses
        Then my email addresses should contain hello123@test.com
    
    Scenario: Remove email
        Given I am logged in
        And removeme@test.com is added in my email addresses
        When I remove removeme@test.com
        Then removeme@test.com should not appear in my addresses
    