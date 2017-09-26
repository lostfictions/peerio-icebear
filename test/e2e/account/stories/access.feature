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
        Given I'm a returning customer
        When I sign in
        Then I have access to my account
    
    Scenario: Sign out
        Given I'm logged in the app
        When I sign out
        Then I can't access my account
    
    Scenario: Email confirmation
        Given I'm a new user
        When I finish creating a new account
        Then I receive an email asking to confirm it
    
    Scenario: Change primary email
        Given I am a registered user
        When I add a new primary email
        And the new email is valid
        Then it should be updated
    
    Scenario: Add new email
        Given I am a registered user
        When I add a new email address
        And the new email is valid
        Then it will be added to my account
    
    Scenario: Remove email
        Given I am a registered user
        When I remove an email address
        Then it will not appear in my account
    