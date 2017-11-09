Feature: Files in rooms
    As a user
    In order to create and share many files

    Background:
        Given I am logged in

    Scenario: Create folder in volume
        Given I create a volume
        Then I can create a folder
        And I can upload a file in a folder

    Scenario: Move file in subfolder
        Given I create a volume
        And I create a subfolder
        And I upload a file
        Then I can move a file into a subfolder