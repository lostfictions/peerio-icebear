Feature: File stream and direct messages
    Files may be shared in a direct message.

    Background:
        Given I am logged in

    Scenario: Share file in DM
        Given I upload a file
        Then I will not see it in my file stream
        And I can share it in a DM
        And the recipient will see an invitation in their file stream

    Scenario: Re-share file in DM
        Given I have received a file
        And I have editor privileges
        Then I will see it in my file stream
        Then I can re-share the file in another DM 
        And I will see it in my files
        And the invitation will be accepted
        And my storage usage will increase
        And the recipient will see it in their file stream
        But their storage usage will not increase

    Scenario: Re-share the same file 
        Given I upload a file
        Then I will not see it in my file stream
        Then I can share it in a DM
        And the recipient will see the invitation in their file stream
        And I can share it again with the same person
        And they will see it bumped in their file stream

    Scenario: Unshare file that hasn't been accepted
        When I upload a file
        And I share it in a DM
        Then I can unshare it
        And the recipient will not have it in their file stream
        And will not be able to accept the invitation

    Scenario: Unshare file that has been accepted
        When I upload a file
        And I share it in a DM
        And the recipient accepts the invitation
        Then the recipient will see it in their file stream
        Then I can unshare it
        And the recipient will not have it in their file stream

    Scenario: Delete a file
        When I upload a file
        And I share it in a DM
        Then I can delete the file
        And the recipient will not have it in their file stream

