Feature: Files in storage
    As a user
    In order to work with my files
    I want to store and access them from anywhere

    Background: 
        Given I am logged in

    Scenario: Upload
        When I upload a file
        Then I should see it in my files
    
    # Scenario: Download
    #     When I download a file
    #     Then I can access a file locally

    Scenario: Share
        When I share a file with a receiver
        Then receiver should see it in their files

    Scenario: Delete
        When I delete a file
        Then it should be removed from my files

    # Scenario: Delete after sharing
    #     Given I upload a file
    #     And I share it with a receiver
    #     When I delete the file
    #     Then it should be removed from my files
    #     And it should be removed from receivers files