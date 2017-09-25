Feature: User profile
    As a customer
    In order to use the app
    I want to have an account
    
    Background: 
        Given I am logged in

    Scenario: Update display name
        When I change my display name
        Then it should be updated
    
    Scenario: Add avatar successfully
        When I upload an avatar
        Then it should appear in my profile
    
    Scenario: Add avatar when another one is being loaded
        When I upload an avatar
        But another avatar upload is in progress
        Then I should get an error saying "Already saving avatar, wait for it to finish."
    
    Scenario: Add avatar with wrong number of pictures
        When I upload an avatar
        But the upload doesn't contain 2 blobs
        Then I should get an error saying "Blobs array length should be 2"
    
    Scenario: Add avatar with malformed payload
        When I upload an avatar
        But the payload is malformed
        Then I should get an error saying "Blobs should be of ArrayBuffer type"

    Scenario: Update avatar
        When I change my existing avatar
        Then the newly uploaded avatar should appear in my profile
    
    Scenario: Remove avatar
        When I change my delete avatar
        Then a default photo should appear in my profile
    
    Scenario: View my profile
        When I request my profile via my username
        Then my contact details are returned
    
    