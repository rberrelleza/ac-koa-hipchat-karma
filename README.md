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


# Run Karma yourself with Docker #
This is an experimental way for you to run Karma yourself using Docker (i.e. "Behind the Firewall" with HipChat Server)

### Prerequisites ###
1. git clone https://bitbucket.org/atlassianlabs/ac-koa-hipchat-karma.git

### Build ###
1. cd ac-koa-hipchat-karma
2. sudo docker build -t atlassian_labs/karma:latest .

### Run ###
1. sudo docker run --name karma-mongo --detach mongo:2.6
2. sudo docker logs karma-mongo
3. sudo docker run --name karma --detach --link karma-mongo:mongo --publish 3020:3020 -e NODE_ENV="production"
   -e LOCAL_BASE_URL="http://your-docker-host-fqdn:3020" -e PORT=3020 atlassian_labs/karma:latest
4. sudo docker logs karma
5. Verify you see a valid capabilities.json returned from http://your-docker-host-fqdn:3020/addon/capabilities

### Install ###
1. Integrate your Docker-Karma with your HipChat account with https://hipchat.example.com/admin/addons (or www.hipchat.com) -> Manage (tab) -> Install an integration from a descriptor URL: http://your-docker-host-fqdn:3020/addon/capabilities
