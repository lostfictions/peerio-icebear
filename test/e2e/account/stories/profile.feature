Feature: User profile
    As a customer
    In order to use the app
    I want to have an account
    
    Background: 
        Given I am logged in

    Scenario: Update display name
        When I change my display name
        Then it should be updated
    
    Scenario: Add avatar
        When I upload an avatar
        Then it should appear in my profile
    
    Scenario: Update avatar
        When I change my existing avatar
        Then the newly uploaded avatar should appear in my profile
    
    Scenario: Remove avatar
        When I change my delete avatar
        Then a default photo should appear in my profile
    