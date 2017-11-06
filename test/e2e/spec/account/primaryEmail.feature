Feature: User account access
   Scenario: Change primary email
        When  I add a new email
        And   the new email is confirmed
        When  I make the new email primary
        Then  the primary email should be updated