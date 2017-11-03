Feature: Favorite contacts
    @confirmedUser
    Scenario: Favorite a contact
        Given I am logged in
        When I favorite a registered user
        Then they will be in my favorite contacts