# Karma #
A global HipChat add-on for adding or removing karma to people and things.

![karma.png](https://bitbucket.org/repo/AnBKL4/images/3241948271-karma.png)

## [Install Me](https://hipchat.com/addons/install?url=https%3A%2F%2Fac-koa-hipchat-karma.herokuapp.com%2Faddon%2Fcapabilities) ##

# Commands #
```
#!html
Usage:
  /karma                 print this help message
  /karma {thing}         lookup something's current karma
  /karma @{MentionName}  lookup a user's current karma by mention name
  {thing}++              add 1 karma to something
  {thing}++++            add 3 karma to something (count(+) - 1, max 5)
  {thing}--              remove 1 karma from something
  {thing}----            remove 3 karma from something (count(-) - 1, max 5)
  "{subject}"++          add 1 karma to a subject phrase
  @{MentionName}++       add 1 karma to a user by mention name

```