Feature: User profile
    Scenario: Add avatar when another one is being loaded
        When another avatar upload is in progress
        Then I should get an error saying Already saving avatar, wait for it to finish.