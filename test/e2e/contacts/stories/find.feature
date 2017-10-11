Feature: Find contacts
    
    Background: 
        Given I am logged in

    Scenario Outline: Find contact
        When I search for <someone>
        And  the contact exists
        Then the contact is added in my favourite contacts
    
    Examples:
        | someone                                        |
        |  ubeugrp7kaes5yjk479wb4zyiszjra                |
        |  ubeugrp7kaes5yjk479wb4zyiszjra@mailinator.com |

    Scenario: Send invite email
        Given I search for Alice
        And no profiles are found
        And I send an invitation
        Then I will see Alice in my Invited list

    Scenario: Filters
        Given "Alice" and "Bob" are my contacts
        And "Alice" has not joined yet
        When I set the filter to 'added'
        Then "Bob" should appear in my contact list
    
    