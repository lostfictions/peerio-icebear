@fileStoreLoaded
Feature: Files in storage
    @wip
    Scenario: Upload a file
        When I upload a file
        Then I should see it in my files