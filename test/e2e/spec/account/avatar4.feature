Feature: User profile
    Scenario: Add avatar with malformed payload
        When the payload is malformed
        Then I should get an error saying Blobs should be of ArrayBuffer type