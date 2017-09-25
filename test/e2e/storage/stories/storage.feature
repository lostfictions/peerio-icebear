Feature: Files in storage
    As a user
    In order to work with my files
    I want to store and access them from anywhere

    Background: 
        Given I am logged in

    Scenario: Upload
        When I upload a file
        Then I should see it in my files
    
    Scenario: Download
        When I download {a file}
        Then I should access {a file} locally

    Scenario: Share
        When I share a file with {the receiver}
        Then {the receiver} should be notified

    Scenario: Delete
        When I delete a file
        Then it should be remove from my files

    Scenario: Access my files
        Given I have uploaded files
        Then I should see the full file list