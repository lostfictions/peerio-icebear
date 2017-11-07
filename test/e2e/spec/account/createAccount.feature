Feature: User account access
    Scenario: Account creation
        Given I am a new customer
        When  I successfully create a new account
        Then  I will be logged in