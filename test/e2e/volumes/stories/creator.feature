Feature: Administering volumes
    As a user
    In order to create and share many files

    Background:
        Given I am logged in
        
    Scenario: Create volume
        When I create a volume
        Then I can share it with someone
        And I can add files to it
    
    Scenario: Convert folder to volume
        Given I create a folder
        Then I can convert it to a volume
        And share it with someone
        And share its contents

    Scenario: Delete volume
        Given I create a volume
        Then I can delete a volume
    
    Scenario: Assign another owner
        Given I create a volume
        Then I can make someone else an owner