# Karma #
A global HipChat add-on for adding or removing karma to people and things.

![karma.png](https://bitbucket.org/repo/AnBKL4/images/3241948271-karma.png)

## [Install Me](https://hipchat.com/addons/install?url=https%3A%2F%2Fac-koa-hipchat-karma.herokuapp.com%2Faddon%2Fcapabilities) ##

# Commands #
```
#!html
Usage:
  /karma                 print this help message
  /karma :enable         enable karma matching in the current room
  /karma :disable        disable karma matching in the current room
  /karma :top things     show the top 10 things
  /karma :bottom things  show the bottom 10 things
  /karma :top users      show the top 10 users
  /karma :bottom users   show the bottom 10 users
  /karma thing           lookup thing's current karma
  /karma @MentionName    lookup a user's current karma by @MentionName
  thing++                add 1 karma to thing
  thing++++              add 3 karma to thing (count(+) - 1, max 5)
  thing--                remove 1 karma from thing
  thing----              remove 3 karma from thing (count(-) - 1, max 5)
  "subject phrase"++     add 1 karma to a subject phrase
  @MentionName++         add 1 karma to a user by @MentionName
```