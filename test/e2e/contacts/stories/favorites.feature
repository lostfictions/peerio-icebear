Feature: Favorite contacts
    As a user
    In order to reach my friends faster
    I want to have favorite contacts
    
    Background: 
        Given I am logged in

    Scenario: Favorite a contact
        When I favorite ku7bpm63xmgfr7nirdz0ucxyi2gngo
        Then ku7bpm63xmgfr7nirdz0ucxyi2gngo will be in my favorite contacts

    Scenario: Unfavorite a contact 
        Given I favorite o6gl796m7ctzbv2u7nij74k1w5gqyi
        When  I unfavorite o6gl796m7ctzbv2u7nij74k1w5gqyi
        Then  o6gl796m7ctzbv2u7nij74k1w5gqyi will not be in my favorites

    Scenario: Create favouite contact on invited email confirmation (sender and receiver)
        Given I confirm my email
        When  I send an invitation to hello@mailinator.com
        And   they confirm their email
        Then  they will be in my favorite contacts
    
     Scenario: Remove favorite contact before email confirmation
        When I send an invitation to hello@mailinator.com
        And  they confirm their email
        But  I unfavorite them
        Then they will not be in my favorites