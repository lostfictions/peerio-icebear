Feature: Find contacts
    #sometimes TypeError: Cannot read property 'should' of undefined
    @unregisteredUser
    Scenario: Send invite email
        Given I am logged in
        When I search for an unregistered user
        And  no profiles are found
        And  I send an invitation to them
        Then they are added in my invited contacts
        And  they should receive an email invitation