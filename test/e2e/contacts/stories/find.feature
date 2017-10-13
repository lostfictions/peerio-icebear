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
        When I search for inviteme@mailinator.com
        And  no profiles are found
        And  I send an invitation to inviteme@mailinator.com
        Then inviteme@mailinator.com is added in my invited contacts
        And  inviteme@mailinator.com should receive an email invitation
    
    Scenario Outline: Filters
        Given <joined> and <invited> are my contacts
        And   <invited> has not joined yet
        When  I set the filter to <filter>
        Then  <outcome> should appear in my contact list
    
    Examples:
        | joined                         | invited                 | filter | outcome
        | ubeugrp7kaes5yjk479wb4zyiszjra | inviteme@mailinator.com | added  | ubeugrp7kaes5yjk479wb4zyiszjra
        | ubeugrp7kaes5yjk479wb4zyiszjra | inviteme@mailinator.com | all    | ubeugrp7kaes5yjk479wb4zyiszjra, inviteme@mailinator.com