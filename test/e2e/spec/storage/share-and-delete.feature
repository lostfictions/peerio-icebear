@fileStoreLoaded
Feature: Files in storage
    @registeredUser
    Scenario: Delete a file after sharing it
        Given I am logged in
        Given I upload a file
        And   I share it with a receiver
        When  I delete the file
        Then  it should be removed from my files
        And   it should be removed from receivers files