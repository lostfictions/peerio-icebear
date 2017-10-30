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
        * Change primary email
    
    Scenario: Add new email
        Given I am logged in
        When I add a new email
        When I am logged in
        Then new email is in my addresses
    
    Scenario: Remove email
        Given I am logged in
        And I add a new email
        When I remove the new email
        Then the new email should not appear in my addresses