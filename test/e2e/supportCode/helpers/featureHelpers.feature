@helper
Feature: Common scenarios
    
    Scenario: Create new user
        Given I am a new customer
        When  I successfully create a new account
        Then  I will be logged in

    Scenario: Create new account
        * Create new account

    Scenario: Create account with username
        * Create account with username

    Scenario: Access shared file
        Given I am logged in
        Then  I should the shared file

    Scenario: Deleted files
        Given I am logged in
        Then  I should not see deleted files

    Scenario: Receive chat request from account
        Given I am logged in
        Then  a chat request pops up

    Scenario: Receive new message from account
        Given I am logged in
        Then  I can read my messages
    
    Scenario: Read new message from account
        Given I am logged in
        Then  I read my messages
    
    Scenario: Receive room invite
        Given I am logged in
        Then  I receive a room invite
    
    Scenario: Accept room invite
        Given I am logged in
        Then  I accept a room invite