Feature: Favorite contacts
    @unregisteredUser
    Scenario: Create favorite contact from invited user
        Given I am logged in
        Given I invite an unregistered user
        And   they sign up
        And   they confirm their email
        Then  they will be in my favorite contacts