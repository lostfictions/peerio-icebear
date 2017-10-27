Feature: Files in storage
    As a user
    In order to work with my files
    I want to store and access them from anywhere

    Background: 
        Given I am logged in

    @fileStoreLoaded
    Scenario: Upload
        When I upload a file
        Then I should see it in my files
    
    @fileStoreLoaded
    Scenario: Download
        Given I upload a file
        When  I download the file
        Then  I can access the file locally

    @fileStoreLoaded
    Scenario: Share
        Given I upload a file
        When  I share it with a receiver
        Then  receiver should see it in their files

    @fileStoreLoaded
    Scenario: Delete
        Given I upload a file
        When  I delete the file
        Then  it should be removed from my files

    @fileStoreLoaded
    Scenario: Delete after sharing
        Given I upload a file
        And   I share it with a receiver
        When  I delete the file
        Then  it should be removed from my files
        And   it should be removed from receivers files