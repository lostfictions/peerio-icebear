Feature: Create a volume
    Users can create, rename, and delete volumes.

    Background:
        Given I am logged in
        
    Scenario: Create volume
        When I create a volume
        Then I can share it with someone
        And I can add files to it

    Scenario: Rename volume
        When I create a volume
        Then I can rename it
    
    Scenario: Convert folder to volume
        When I create a folder
        Then I can convert it to a volume
        And share it with someone
        And share its contents

    Scenario: Delete volume
        When I create a volume
        Then I can delete a volume
        And no one will be able to access it