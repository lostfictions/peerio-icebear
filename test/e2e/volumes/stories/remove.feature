Feature: Removing files from volumes
    The owner of a volume should be able to remove files from a volume, but this file should stay
    in the original owner's Trash. Owners of files, even when not owners of the containing volume, 
    should be able to remove their files from the volume.

    Background:
        Given I am logged in
        And have access to a volume with files

    @owner 
    Scenario: Remove someone else's file
        Given someone else has uploaded a file to a volume
        Then I can remove it
        And they will be able to recover it from their Trash

    @editor
    Scenario: Remove file
        When I upload a file to a volume
        Then I can remove it from the volume

    @editor
    Scenario: Delete file
        When I upload a file to a volume
        Then I can delete it altogether

    @editor
    Scenario: Fail to remove someone else's file
        Given someone else has uploaded a file to a volume
        Then I cannot remove it

    @owner
    Scenario: Delete volume
        Given someone else has uploaded a file to a volume
        And I have uploaded a file to a volume
        Then I can delete the volume
        And my file will be deleted
        But their file will be in their Trash
    