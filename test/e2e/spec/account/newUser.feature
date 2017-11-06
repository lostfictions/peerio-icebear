Feature: subScenarios
    @subScenario
    Scenario: Create new user
        Given I am a new customer
        When  I successfully create a new account
        Then  I will be logged in

    @subScenario
    Scenario: Create new account
        * Create new account

    @subScenario
    Scenario: Create account with username
        * Create account with username