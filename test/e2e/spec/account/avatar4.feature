Feature: User profile
    Scenario: Add avatar with malformed payload
        Given I am logged in
        When the payload is malformed
        Then I should get an error saying Blobs should be of ArrayBuffer type