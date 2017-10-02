Feature: User account access
    As a customer
    In order to use the app
    I want to have an account
    
    Scenario: Account creation
        Given I am a new customer
        When I successfully create a new account
        Then I will be logged in