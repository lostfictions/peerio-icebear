Feature: User account access
    Scenario: Remove email
        And I add a new email
        When I remove the new email
        Then the new email should not appear in my addresses