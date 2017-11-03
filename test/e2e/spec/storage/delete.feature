@fileStoreLoaded
Feature: Files in storage
    Scenario: Delete uploaded file
        Given I am logged in
        Given I upload a file
        When  I delete the file
        Then  it should be removed from my files