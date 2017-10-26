Feature: Find contacts
    
    Background: 
        Given I am logged in

    @registeredUser
    Scenario: Find contact by username
        When I search for a registered username
        And  the contact exists
        Then the contact is added in my contacts

    @registeredUser
    Scenario: Find contact by email
        When I search for a registered email
        And  the contact exists
        Then the contact is added in my contacts

    #sometimes TypeError: Cannot read property 'should' of undefined
    @unregisteredUser
    Scenario: Send invite email
        When I search for an unregistered user
        And  no profiles are found
        And  I send an invitation to them
        Then they are added in my invited contacts
        And  they should receive an email invitation