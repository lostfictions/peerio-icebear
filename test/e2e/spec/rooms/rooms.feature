Feature: subScenarios
    @subScenario
    Scenario: Receive room invite
        Given I am logged in
        Then  I receive a room invite
    
    @subScenario
    Scenario: Accept room invite
        Given I am logged in
        Then  I accept a room invite