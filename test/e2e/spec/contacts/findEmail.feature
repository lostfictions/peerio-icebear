Feature: Find contacts
    @confirmedUser
    Scenario: Find contact by email
        Given I am logged in
        When I search for a registered email
        And  the contact exists
        Then the contact is added in my contacts