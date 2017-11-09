Feature: Administering volumes
    As a user
    In order to create and share many files

    Background:
        Given I am logged in

    Scenario: Delete volume
        Given I own a volume
        Then I can delete a volume

    Scenario: Rename volume
        Given I own a volume
        Then I can rename a volume

    Scenario: Change volume permissions
        Given I own a volume
        And share it with several people
        Then I can remove someone

    Scenario: Change volume permissions
        Given I own a volume
        And share it with several people
        Then I can remove someone

    Scenario: Re-sharing a volume with a user who has accepted it

    Scenario: Re-sharing a volume with a user who has been invited 

    Scenario: Sharing a file from a volume with a user who shares the volume

    Scenario: Sharing a file from a volume with a user who has been invited to the volume

    Scenario: Sharing a file from a volume with a user who does not share the volume

    