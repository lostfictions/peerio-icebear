Feature: User account access
    As a customer
    In order to use the app
    I want to have an account
    
    Scenario: Account creation
        * I successfully create an account
    
    Scenario: Account deletion
        Given I am logged in
        And my email is confirmed
        When I delete my account
        Then I should not be able to login

    Scenario: Sign in
        Given I am a returning customer
        When I sign in
        Then I have access to my account
    
    Scenario: Sign out
        Given I am logged in
        When I sign out
        Then I can not access my account
    
    Scenario: Change primary email
        Given I am logged in
        And my email is confirmed
        When I add a new email
        And the new email is confirmed
        When I make the new email primary
        Then the primary email should be updated
    
    Scenario: Add new email
        Given I am logged in
        When hello123@test.com is added in my email addresses
        Then my email addresses should contain hello123@test.com
    
    Scenario: Remove email
        Given I am logged in
        And removeme@test.com is added in my email addresses
        When I remove removeme@test.com
        Then removeme@test.com should not appear in my addresses