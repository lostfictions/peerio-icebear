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
        Given I favorite ku7bpm63xmgfr7nirdz0ucxyi2gngo
        And   ku7bpm63xmgfr7nirdz0ucxyi2gngo will be in my favorite contacts
        When  I unfavorite ku7bpm63xmgfr7nirdz0ucxyi2gngo
        Then  ku7bpm63xmgfr7nirdz0ucxyi2gngo will not be in my favorites

    Scenario: Create favorite contact from invited user
        Given I invite a new user
        And   they sign up
        And   they confirm their email
        Then  they will be in my favorite contacts
    
    Scenario: Remove favorite contact before email confirmation
        Given I invite a new user
        But   I remove the invitation
        When  they sign up
        And   they confirm their email
        Then  they will not be in my favorites