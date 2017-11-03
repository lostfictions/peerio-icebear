@fileStoreLoaded
Feature: Files in storage
    As a user
    In order to work with my files
    I want to store and access them from anywhere

    Background: 
        Given I am logged in

    @wip
    Scenario: Upload a file
        When I upload a file
        Then I should see it in my files
    
    Scenario: Download a file
        Given I upload a file
        When  I download the file
        Then  I can access the file locally

    @registeredUser
    Scenario: Share a file
        Given I upload a file
        When  I share it with a receiver
        Then  receiver should see it in their files

    Scenario: Delete uploaded file
        Given I upload a file
        When  I delete the file
        Then  it should be removed from my files

    @registeredUser
    Scenario: Delete a file after sharing it
        Given I upload a file
        And   I share it with a receiver
        When  I delete the file
        Then  it should be removed from my files
        And   it should be removed from receivers files