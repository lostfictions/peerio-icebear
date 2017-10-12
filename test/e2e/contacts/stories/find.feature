Feature: Find contacts
    
    Background: 
        Given I am logged in

    Scenario Outline: Find contact
        When I search for <someone>
        And  the contact exists
        Then the contact is added in my contacts
    
    Examples:
        | someone                                       |
        | ubeugrp7kaes5yjk479wb4zyiszjra                |
        | ubeugrp7kaes5yjk479wb4zyiszjra@mailinator.com |

    Scenario: Send invite email
        When I search for hello@mailinator.com
        And  no profiles are found
        And  I send an invitation to hello@mailinator.com
        Then hello@mailinator.com is added in my invited contacts
        And  hello@mailinator.com should receive an email invitation

    Scenario: Filters
        Given "Alice" and "Bob" are my contacts
        And "Alice" has not joined yet
        When I set the filter to 'added'
        Then "Bob" should appear in my contact list
    
    