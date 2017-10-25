Feature: Common scenarios
    
    Scenario: Account creation
        Given I am a new customer
        When  I successfully create a new account
        Then  I will be logged in

    Scenario: Change primary email
        Given I am logged in
        And   my email is confirmed
        When  I add a new email
        And   the new email is confirmed
        When  I make the new email primary
        Then  the primary email should be updated

    Scenario: Access my files
        Given I am logged in
        Then  I should see my files

    Scenario: Deleted files
        Given I am logged in
        Then  I should not see deleted files

    Scenario: Create account with username
        * Create account with username

    Scenario: Receive chat request from account
        Given I am logged in
        Then  a chat request pops up

    Scenario: Receive new message from account
        Given I am logged in
        Then  I can read my messages
    
    Scenario: Read new message from account
        Given I am logged in
        Then  I read my messages