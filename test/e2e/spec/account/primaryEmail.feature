Feature: User account access
   @wip
   Scenario: Change primary email
        Given I am logged in
        When  I add a new email
        And   the new email is confirmed
        When  I make the new email primary
        Then  the primary email should be updated