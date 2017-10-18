Feature: Find contacts
    
    Background: 
        Given I am logged in

    # has to be a confirmed account
    Scenario Outline: Find contact
        When I search for <someone>
        And  the contact exists
        Then the contact is added in my contacts
    
    Examples:
        | someone                                       |
        | o6gl796m7ctzbv2u7nij74k1w5gqyi                |
        | o6gl796m7ctzbv2u7nij74k1w5gqyi@mailinator.com |

    Scenario: Send invite email
        When I search for inviteme@mailinator.com
        And  no profiles are found
        And  I send an invitation to inviteme@mailinator.com
        Then inviteme@mailinator.com is added in my invited contacts
        And  inviteme@mailinator.com should receive an email invitation