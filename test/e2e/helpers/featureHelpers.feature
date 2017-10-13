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