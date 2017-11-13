Feature: Rooms
    Files may be shared in rooms.

    Background:
        Given I am logged in

    Scenario: Share file in DM
        When I upload a file
        Then I can share it in a DM

    Scenario: Re-share file in room
        When I have received a file
        And I have editor privileges
        Then I can re-share the file in a room

    Scenario: Re-share file in DM
        When I have received a file invitation
        And I have editor privileges
        Then I will see it in my file stream
        Then I can re-share the file in another room 
        Then the invitation will be accepted
        And I will see it in my files
        And my storage usage will increase
        And the recipients will see it in their file streams
        But their storage usage will not increase

    Scenario: Re-share the same file 
        When I upload a file
        Then I will not see it in my file stream
        Then I can share it in a room
        And the room members  will see it in their file streams
        And I can share it again with the same room
        And the room members will see it bumped in their file stream

    Scenario: Join room and see past files
        Given I upload a file
        When I share it in a room
        And someone else joins the room
        Then they will be able to accept the file invitation

