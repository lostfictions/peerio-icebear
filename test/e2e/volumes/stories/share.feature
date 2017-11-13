Feature: Sharing volumes
    Invitations to volumes must be accepted wholesale, although it is possible for users to mention
    files within volumes individually. These, however, will not end up in the file stream independently
    of the volume. Users may share individual files from a volume with users who they do not wish
    to invite to the volume, but only in read-only mode.

    Background:
        Given I am logged in
        And I have a volume
        And I have a room

    @owner
    Scenario: Share volume with room
        When I share the volume in the room
        Then the invitation is in the recipient's file stream
        And the invitation is sent in a message

    @owner
    Scenario: Unshare volume with room
        When I share the volume in the room
        And I unshare it
        Then the room members can no longer access it

    @owner
    Scenario: Re-sharing a volume with a user who has accepted it
        When I share a volume with a room
        And a user in the room accepts the invitation
        And then I re-share the volume with that user 
        Then the user will have it bumped in their file stream
        But will not have any duplication

    @owner
    Scenario: Re-sharing a volume with a user who has been invited 
        When I share a volume with a room
        And a user does not accept the invitation
        And then I re-share the volume with that user 
        Then the user will have it bumped in their file stream
        But will not have any duplication
        And will be able to accept

    @owner
    Scenario: Sharing a file from a volume with a user who shares the volume
        When I share a volume with a room
        And a user in the room accepts the invitation
        And I re-share a file from the volume in a DM with that user 
        Then the user will have the volume bumped up in their file stream
        But will not see the individual file in the stream
        And will see a reference to the file in a message 

    @owner
    Scenario: Sharing a file from a volume with a user who has been invited to the volume
        When I share a volume with a room
        And a user in the room does not accept the invitation
        And I re-share a file from the volume in a DM with that user 
        Then the user will have the volume invitation bumped up in their file stream
        But will not see the individual file in the stream
        And will see a reference to the volume invitation in a message 

    @owner
    Scenario: Sharing a file from a volume with a user who does not share the volume
        When I share a file from a volume with a user who isn't in the volume
        And the user accepts the invitation
        Then they will have read-only access
        And will not see the full volume
