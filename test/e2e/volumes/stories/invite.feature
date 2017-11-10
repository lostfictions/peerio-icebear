Feature: Inviting users to volumes
    Users who have created volumes should be able to invite other users, have them join, and change their privileges. 

    Background:
        Given I am logged in

    @owner
    Scenario: Remove from volume
        When I invite someone
        Then they can join
        And I can remove them

    @owner
    Scenario: Change volume permissions
        When I invite someone
        Then they can join with editor privileges
        And I can demote them to read-only
        And they will only be able to read

    @owner
    Scenario: Add an owner to a volume
        When I invite someone
        Then they can join with editor privileges
        And I can promote them to owner
        And they will have owner privileges

    @owner
    Scenario: Add a read-only user to a volume
        When I invite someoneas read-only
        Then they will only be able to read

    @owner
    Scenario: Fail to invite a user to a volume as editor
        I cannot invite new users

    @owner    
    Scenario: Fail to invite a user to a volume as viewer
        I cannot invite new users

    