@registeredUser
Feature: Direct messages
    # also test more favs
    Scenario: Favorite direct message conversation
        Given I am logged in
        Given I create a direct message
        When  I favorite a direct message conversation
        Then  it appears on top of others